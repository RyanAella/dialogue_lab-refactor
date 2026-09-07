/**
 * @module MessageHandlers
 * Handles mode-specific message sending logic for transformation and roleplay modes.
 * Dynamic version that works with all path configurations.
 */

import { API } from "../services/api.js";
import { Chat } from "../features/chat.js";
import { DataLogger } from "../services/dataLogger.js";
import { APP_CONFIG, UI_TEXTS, EXERCISE_TYPES, APP_MODES } from "../core/config.js";
import { PROMPT_TEMPLATES, getFallbackPrompt } from "../core/promptBuilder.js";
import { UI } from "../ui/ui.js";
import { ScenarioService } from "../features/scenario.js";
import { STATE, enableSidebarButtons } from "../core/state.js";
import { appendPartnerMessage, updateInputAndStatus } from "../ui/uiHelpers.js";

/**
 * Determines if we're in transformation mode
 * @returns {boolean}
 */
function isTransformationMode() {
  const currentMode = STATE.currentMode || 'simulation';
  return currentMode === APP_MODES.TRANSFORMATION ||
      currentMode === EXERCISE_TYPES.TRANSFORMATION ||
      currentMode === 'transformation';
}

/**
 * Generates a human-readable progress indicator for transformation mode.
 * @returns {string}
 */
export function getTransformationProgressText() {
  return STATE.activeStatements && STATE.activeStatements.length
      ? `Aussage ${STATE.exerciseIndex + 1} von ${STATE.activeStatements.length}`
      : UI_TEXTS.status.ready || "Bereit";
}

/**
 * Shared preparation logic for both message modes.
 * @param {string} userVal - The trimmed user input value
 * @returns {Object|null} - config object or null if validation fails
 */
export function prepareMessageSend(userVal) {
  if (!userVal) return null;

  const config = ScenarioService.getActive();
  if (!config) return null;

  UI.prepareForInteraction();
  UI.appendMessage(userVal, "user");
  if (STATE.ttsEnabled) UI.speak(userVal, UI_TEXTS.tts.userLabel || "Ich");

  DataLogger.addTurn("user", userVal, {
    mode: STATE.currentMode,
    scenarioId: config.id,
    scenarioTitle: config.title
  });

  Chat.add("user", userVal);
  UI.elements.userInput.value = "";

  return config;
}

/**
 * Handles message sending in ROLEPLAY mode.
 * Manages real-time conversation with the AI partner.
 * @param {Object} config - The scenario configuration
 * @returns {Promise<void>}
 */
async function handleRoleplaySend(config) {
  UI.updateInputUI(true, UI_TEXTS.status.sending || "Sende...", "loading", UI_TEXTS.status.sending || "Sende...");
  UI.showTypingIndicator(config.roleName);

  const messages = Chat.getHistory();

  try {
    const data = await API.callChatApi(messages, {
      proxyUrl: APP_CONFIG.PROXY_URL,
      model: APP_CONFIG.MODEL,
      temperature: APP_CONFIG.CHAT_TEMPERATURE,
    });
    if (!data) return;

    const botResp = data.choices[0].message.content;
    UI.appendMessage(botResp, "partner", { roleName: config.roleName });
    Chat.add("assistant", botResp);

    DataLogger.addTurn("assistant", botResp, {
      roleName: config.roleName,
      mode: STATE.currentMode,
      scenarioId: config.id
    });

    if (STATE.ttsEnabled) UI.speak(botResp, config.roleName);
    UI.updateStatus("idle", UI_TEXTS.status.ready || "Bereit");
  } catch (e) {
    UI.updateStatus("error", e.message || "Fehler beim Senden");
  } finally {
    UI.hideTypingIndicator();
    UI.updateInputUI(false, UI_TEXTS.input.roleplay?.(config.roleName) || "Nachricht eingeben...");
    UI.elements.userInput.focus();
  }
}

/**
 * Handles message sending in TRANSFORMATION mode.
 * Provides immediate feedback for each transformation attempt.
 * @param {Object} config - The scenario configuration
 * @param {string} userVal - The user input value
 * @returns {Promise<void>}
 */
async function handleTransformationSend(config, userVal) {
  UI.updateInputUI(true, UI_TEXTS.status.analyzing || "Analysiere...");
  UI.showTypingIndicator(config.roleName);

  // Save response
  if (!STATE.answers) STATE.answers = [];
  STATE.answers.push({
    statement: STATE.activeStatements[STATE.exerciseIndex],
    userResponse: userVal,
  });

  // Get immediate feedback
  try {
    const evalPrompt = Chat.getSystemPrompt() || config.prompts?.trainer || getFallbackPrompt("transformation");
    const userPrompt = PROMPT_TEMPLATES.transformation?.userEvaluation
        ? PROMPT_TEMPLATES.transformation.userEvaluation(
            STATE.activeStatements[STATE.exerciseIndex],
            STATE.answers[STATE.answers.length - 1].userResponse
        )
        : `Aufgabe: Formuliere die Aussage "${STATE.activeStatements[STATE.exerciseIndex]}" um.\n\nEingabe des Nutzers: "${userVal}"\n\nGib eine kurze, hilfreiche Rückmeldung (max. 2-3 Sätze) zu dieser spezifischen Umformulierung.`;

    const data = await API.callChatApi(
        [
          { role: "system", content: evalPrompt },
          { role: "user", content: userPrompt },
        ],
        {
          proxyUrl: APP_CONFIG.PROXY_URL,
          model: APP_CONFIG.MODEL,
          temperature: APP_CONFIG.ICH_BOTSCHAFT_TEMPERATURE || APP_CONFIG.COACH_TEMPERATURE,
        }
    );

    if (data) {
      const feedback = data.choices[0].message.content;
      UI.appendMessage(feedback, "partner", {
        roleName: config.roleName,
        messageType: "feedback",
        isIchMode: true,
      });
      Chat.add("assistant", feedback);

      DataLogger.addTurn("assistant", feedback, {
        roleName: config.roleName,
        messageType: "feedback",
        mode: STATE.currentMode,
        scenarioId: config.id
      });

      if (STATE.ttsEnabled) UI.speak(feedback, config.roleName);
    }
  } catch (e) {
    console.error("Direct Feedback Error:", e);
  } finally {
    UI.hideTypingIndicator();
    UI.updateInputUI(false, UI_TEXTS.input.retryOrContinue || "Versuche es noch einmal oder klicke auf 'Weiter'...");
    if (UI.elements.nextTaskBtn) {
      UI.elements.nextTaskBtn.classList.remove("hidden");
    }
  }
}

/**
 * Main message handler that routes to mode-specific handlers.
 * @returns {Promise<void>}
 */
export async function handleSend() {
  const userVal = UI.elements.userInput.value.trim();
  const config = prepareMessageSend(userVal);

  if (!config) return;

  // Enable sidebar buttons on first interaction
  enableSidebarButtons();

  // Route to the appropriate handler based on current mode
  if (isTransformationMode()) {
    await handleTransformationSend(config, userVal);
  } else {
    await handleRoleplaySend(config);
  }
}

/**
 * Switches to the next statement in transformation mode.
 * @returns {void}
 */
export function handleNextExercise() {
  const config = ScenarioService.getActive();
  if (!config) return;

  UI.elements.nextTaskBtn?.classList.add("hidden");
  STATE.exerciseIndex++;

  // Clear input and update UI (disables send button automatically)
  UI.elements.userInput.value = "";
  UI.updateInputUI(false, "");

  if (STATE.exerciseIndex < STATE.activeStatements.length) {
    const nextStatement = STATE.activeStatements[STATE.exerciseIndex];
    const taskText = `"${nextStatement}"\n\n${config.shortInstruction}`;

    appendPartnerMessage(taskText, config, { shouldScroll: false });

    if (STATE.ttsEnabled) UI.speak(taskText, config.roleName);
    updateInputAndStatus(false, UI_TEXTS.input.transformationNext || "Deine neue Umformulierung...", "idle", getTransformationProgressText());
  } else {
    const endMsg = UI_TEXTS.status.allExercisesDone || "Alle Aussagen bearbeitet. Klicke jetzt auf 'Auswertung erstellen', um dein abschließendes Feedback zu erhalten.";
    UI.appendMessage(endMsg, "partner", {
      roleName: config.roleName,
      messageType: "task",
      isIchMode: true,
    });
    updateInputAndStatus(true, UI_TEXTS.input.allDone || "Alle Aufgaben erledigt.", "idle", UI_TEXTS.status.exerciseComplete || "Übung abgeschlossen");
  }
}