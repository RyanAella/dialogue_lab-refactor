/**
 * @module ModeManager
 * Handles mode switching and mode-specific state management.
 * Dynamically adapts to path-based configuration (practice-edition, simulation-lab, or full version).
 */

import { UI } from "../ui/ui.js";
import { DataLogger } from "../services/dataLogger.js";
import { APP_CONFIG, APP_MODES, EXERCISE_TYPES, UI_TEXTS, DIALOGUE_LAB_CONFIG } from "./config.js";
import { ScenarioService } from "../features/scenario.js";
import { STATE, resetState, resetUI, resetSidebarButtons } from "./state.js";
import { appendPartnerMessage, updateInputAndStatus, showBriefingError } from "../ui/uiHelpers.js";
import { initExerciseDropdown, initScenarioDropdown } from "../utils/dropdowns.js";
import { getTransformationProgressText } from "../utils/messageHandlers.js";

/**
 * Resets the application state and UI for the current mode.
 * @param {string} mode - The mode to reset for (APP_MODES.*).
 * @returns {void}
 */
export function resetAppForMode(mode) {
  STATE.currentMode = mode;

  // Only set mode select value if the element exists (hidden in practice-edition)
  if (UI.elements.modeSelect) {
    UI.elements.modeSelect.value = mode;
  }

  resetState();
  resetUI();

  // Scroll to top of chat window
  const mainElement = UI.elements.chatWindow?.closest("main");
  if (mainElement) mainElement.scrollTo(0, 0);

  // Show briefing content
  UI.elements.briefingContent?.classList.remove("hidden");
  UI.setBriefingExpanded(true);
  UI.setModeBadge(mode);

  resetSidebarButtons();

  // Update feedback button text based on current mode
  if (UI.elements.feedbackBtn) {
    const modeKey = Object.keys(APP_MODES).find(key => APP_MODES[key] === mode)?.toLowerCase();
    if (modeKey && UI_TEXTS.feedbackBtn[modeKey]) {
      UI.elements.feedbackBtn.innerHTML = UI_TEXTS.feedbackBtn[modeKey];
    }
  }
}

/**
 * Fetches the initial exercise catalog from the server using the ScenarioService.
 * @async
 */
export async function loadExercises() {
  try {
    await ScenarioService.loadPool();
  } catch (error) {
    UI.updateStatus("error", `${UI_TEXTS.errors.prefix} ${error.message}`);
    showBriefingError(`${UI_TEXTS.errors.prefix} ${error.message}`);
  }
}

/**
 * Configures the application for Transformation mode.
 * @async
 * @param {string} [exerciseId] - The ID of the exercise to activate.
 */
export async function switchToTransformationMode(exerciseId) {
  await DataLogger.endConversation();
  resetAppForMode(APP_MODES.TRANSFORMATION);

  // Only update input if element exists
  updateInputAndStatus(
      true,
      UI_TEXTS.input.chooseExercise || "Wähle eine Übung...",
      "idle",
      UI_TEXTS.status.transformationActive || "Transformationen aktiv"
  );

  await initExerciseDropdown();

  const transformationExercises = ScenarioService.getExercisesByType(EXERCISE_TYPES.TRANSFORMATION);
  if (transformationExercises.length > 0) {
    if (UI.elements.exerciseSelect) {
      const targetExercise = exerciseId
          ? transformationExercises.find(ex => ex.id === exerciseId)
          : transformationExercises[0];
      UI.elements.exerciseSelect.value = targetExercise.id;
      UI.elements.exerciseSelect.dispatchEvent(new Event("change"));
    }
  } else {
    updateInputAndStatus(
        true,
        UI_TEXTS.errors.noExercises || "Keine Übungen verfügbar.",
        "idle",
        UI_TEXTS.errors.noExercises || "Keine Übungen verfügbar."
    );
  }
}

/**
 * Configures the application for Roleplay/Simulation mode.
 * @async
 */
export async function switchToRoleplayMode() {
  const active = ScenarioService.getActive();
  const previousId = (active && active.id && active.type === EXERCISE_TYPES.SIMULATION)
      ? active.id
      : null;

  await DataLogger.endConversation();

  resetAppForMode(APP_MODES.ROLEPLAY);
  UI.updateInputUI(true, UI_TEXTS.input.chooseScenario || "Wähle ein Szenario...");

  await initScenarioDropdown();

  const simulationExercises = ScenarioService.getExercisesByType(EXERCISE_TYPES.SIMULATION);
  if (simulationExercises.length > 0) {
    const exists = simulationExercises.some(ex => ex.id === previousId);
    if (UI.elements.scenarioSelect) {
      UI.elements.scenarioSelect.value = exists ? previousId : simulationExercises[0].id;
      UI.elements.scenarioSelect.dispatchEvent(new Event("change"));
    }
  } else {
    UI.updateStatus("idle", UI_TEXTS.errors.noSimulations || "Keine Rollenspiel-Szenarien verfügbar.");
  }

  // Update subtitle if element exists
  const subtitleEl = document.getElementById("main-subtitle");
  if (subtitleEl) {
    subtitleEl.textContent = UI_TEXTS.subtitles.roleplay || "Lies das Briefing und starte das Gespräch mit einer Nachricht.";
  }

  updateInputAndStatus(
      true,
      UI_TEXTS.input.chooseScenario || "Wähle ein Szenario...",
      "idle",
      UI_TEXTS.status.roleplayActive || "Simulationen aktiv"
  );
}

/**
 * Resets the current transformation session.
 * @returns {void}
 */
export function restartTransformationExercise() {
  resetState();
  STATE.activeStatements = ScenarioService.getStatements(true);

  resetUI();
  resetSidebarButtons();

  if (UI.elements.feedbackBtn) {
    const modeKey = Object.keys(APP_MODES).find(key => APP_MODES[key] === STATE.currentMode)?.toLowerCase();
    if (modeKey && UI_TEXTS.feedbackBtn[modeKey]) {
      UI.elements.feedbackBtn.innerHTML = UI_TEXTS.feedbackBtn[modeKey];
    }
  }

  const config = ScenarioService.getActive();
  if (!config) return;

  const statement = STATE.activeStatements[STATE.exerciseIndex];
  if (!statement) return;

  const taskText = `"${statement}"\n\n${config.shortInstruction}`;

  appendPartnerMessage(taskText, config);
  if (STATE.ttsEnabled) UI.speak(taskText, config.roleName);
  UI.updateInputUI(false, UI_TEXTS.input.transformationRestart || "Eingabe...");
  UI.updateStatus("idle", `${getTransformationProgressText()} (${UI_TEXTS.status.restarting || "restarted"})`);
}

/**
 * Initializes the current mode based on path configuration.
 * Automatically selects the appropriate mode (transformation, simulation, or full).
 * @async
 */
export async function initializeCurrentMode() {
  const config = DIALOGUE_LAB_CONFIG || APP_CONFIG;
  const allowedModes = config.ALLOWED_MODES || ['SIMULATION', 'ROLEPLAY', 'TRANSFORMATION'];
  const defaultMode = config.DEFAULT_MODE || 'SIMULATION';

  // Hide UI elements that aren't allowed in this path
  if (config.HIDE_SIMULATION) {
    document.getElementById('scenario-section')?.classList.add('hidden');
  }
  if (config.HIDE_TRANSFORMATION) {
    document.getElementById('exercise-section')?.classList.add('hidden');
  }
  if (config.HIDE_ROLEPLAY) {
    // Hide mode select if only one mode is available
    document.getElementById('mode-select')?.classList.add('hidden');
  }

  // Initialize based on default mode
  if (defaultMode === 'TRANSFORMATION' || (allowedModes.includes('TRANSFORMATION') && !allowedModes.includes('SIMULATION'))) {
    await switchToTransformationMode();
  } else {
    await switchToRoleplayMode();
  }

  // Set current mode in STATE
  STATE.currentMode = defaultMode.toLowerCase();
}

// Export for global access (used in index.html onclick attributes)
window.restartTransformationExercise = restartTransformationExercise;
window.switchToRoleplayMode = switchToRoleplayMode;
window.switchToTransformationMode = switchToTransformationMode;