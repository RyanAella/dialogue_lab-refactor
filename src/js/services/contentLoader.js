/**
 * @module ContentLoader
 * Handles loading of scenario and exercise content.
 * Dynamic version that works with all path configurations (practice-edition, simulation-lab, full).
 */

import { UI } from "../ui/ui.js";
import { DataLogger } from "./dataLogger.js";
import { EXERCISE_TYPES, UI_TEXTS, APP_MODES } from "../core/config.js";
import { ScenarioService } from "../features/scenario.js";
import { STATE } from "../core/state.js";
import { Utils } from "../utils/utils.js";
import { getProfilePool } from "../features/profiles.js";
import { PromptBuilder } from "../core/promptBuilder.js";
import { getTransformationProgressText } from "../utils/messageHandlers.js";
import { appendPartnerMessage } from "../ui/uiHelpers.js";

/**
 * Determines if the current mode is transformation.
 * @returns {boolean} True if in transformation mode
 */
function isTransformationMode() {
  const currentMode = STATE.currentMode || 'simulation';
  return currentMode === APP_MODES.TRANSFORMATION ||
      currentMode === 'transformation' ||
      currentMode === 'TRANSFORMATION';
}

/**
 * Main entry point for loading specific content (scenarios or exercises).
 * Fetches data via ScenarioService and updates UI components, avatars, and briefing.
 *
 * @async
 * @param {string} exerciseId - The ID of the content to load.
 */
export async function loadContent(exerciseId) {
  UI.updateStatus("loading", UI_TEXTS.status.loading);
  UI.setBriefingLoading(true);
  UI.elements.chatWindow.innerHTML = "";

  STATE.lastFeedback = null;

  try {
    const config = await ScenarioService.loadScenario(exerciseId);

    // Central prompt management - different for transformation vs simulation
    if (isTransformationMode()) {
      PromptBuilder.setupSystemPrompt(APP_MODES.TRANSFORMATION, config);
    } else {
      PromptBuilder.setupSystemPrompt(config, true);
    }

    DataLogger.updateConversationMetadata({
      mode: STATE.currentMode,
      scenarioId: config.id,
      scenarioTitle: config.title,
      scenarioType: config.type
    });

    // Update partner name display
    if (UI.elements.partnerNameDisplay) {
      UI.elements.partnerNameDisplay.textContent = config.roleName;
    }

    // Initialize avatar with appropriate profile
    const profileKey = config.roleLabel || config.roleName;
    const profilePool = getProfilePool(profileKey);
    await UI.initAvatar(profilePool);

    // Render briefing content (common for both modes)
    Utils.renderBoldMarkdownWithLineBreaks(UI.elements.briefingContent, config.instructionSection);

    // Speak briefing if TTS is enabled
    if (STATE.ttsEnabled) {
      UI.speak(config.instructionSection, UI_TEXTS.tts.briefingLabel);
    }

    // Set chevron rotation
    UI.elements.chevron.style.transform = "rotate(0deg)";

    // Transformation mode specific logic
    if (isTransformationMode()) {
      STATE.activeStatements = ScenarioService.getStatements(true);
      STATE.exerciseIndex = 0;

      // Update subtitle with transformation-specific text
      if (document.getElementById("main-subtitle")) {
        document.getElementById("main-subtitle").textContent =
            UI_TEXTS.subtitles.transformation?.(config.title, config.shortInstruction) ||
            `${config.title}: ${config.shortInstruction}`;
      }

      // Show first task immediately
      const firstStatement = STATE.activeStatements[0];
      if (firstStatement) {
        const taskText = `"${firstStatement}"\n\n${config.shortInstruction}`;
        appendPartnerMessage(taskText, config);
      }

      UI.updateInputUI(false, UI_TEXTS.input.transformation || "Eingabe...");
      UI.updateStatus("idle", getTransformationProgressText());
    }
    // Simulation mode specific logic
    else {
      // Show start info for simulation mode
      if (UI.elements.startInfo) {
        UI.elements.startInfo.classList.remove("hidden");
        UI.elements.chatWindow.appendChild(UI.elements.startInfo);
      }

      // Update subtitle with simulation-specific text
      if (document.getElementById("main-subtitle")) {
        document.getElementById("main-subtitle").textContent =
            UI_TEXTS.subtitles.roleplay || "Lies das Briefing und starte das Gespräch mit einer Nachricht.";
      }

      UI.updateInputUI(false, UI_TEXTS.input.roleplay?.(config.roleName) || "Nachricht eingeben...");
      UI.updateStatus("idle", UI_TEXTS.status.ready || "Bereit");
    }
  } catch (error) {
    console.error("Content loading failed:", error);
    if (UI.elements.briefingContent) {
      UI.elements.briefingContent.innerHTML = `<p class="text-red-500 p-4">${UI_TEXTS.errors.contentLoadingError}.</p>`;
    }
    UI.updateStatus("error", UI_TEXTS.errors.contentLoadingError);
  }
}