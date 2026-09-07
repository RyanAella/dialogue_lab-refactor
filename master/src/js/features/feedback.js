/**
 * @module Feedback
 * Handles feedback requests and modal management.
 * Dynamic version that works with path-based configuration.
 */

import { APP_CONFIG, FEEDBACK_MESSAGES } from '../core/config.js';
import { API } from '../services/api.js';
import { Chat } from './chat.js';
import { DataLogger } from '../services/dataLogger.js';
import { UI } from '../ui/ui.js';
import { ScenarioService } from './scenario.js';
import { STATE } from '../core/state.js';
import { getFallbackPrompt } from '../core/promptBuilder.js';

/**
 * Gets the current mode configuration for feedback.
 * @returns {{promptType: string, loadingTitleKey: string, loadingStatusKey: string, modalTitleKey: string, ttsKey: string, resetFunction: string}}
 */
function getFeedbackConfig() {
  const currentMode = STATE.currentMode || 'simulation';

  // Determine which mode we're in
  const isTransformation = currentMode === 'transformation' ||
      currentMode === 'TRANSFORMATION';
  const isSimulation = currentMode === 'simulation' ||
      currentMode === 'roleplay' ||
      currentMode === 'ROLEPLAY' ||
      currentMode === 'SIMULATION';

  return {
    promptType: isTransformation ? 'trainer' : 'mentor',
    loadingTitleKey: isTransformation ? 'transformation' : 'simulation',
    loadingStatusKey: isTransformation ? 'transformation' : 'simulation',
    modalTitleKey: isTransformation ? 'transformation' : 'simulation',
    ttsKey: isTransformation ? 'transformation' : 'simulation',
    resetFunction: isTransformation ? 'restartTransformationExercise' : 'switchToRoleplayMode'
  };
}

/**
 * Gets the fallback prompt for the current mode.
 * @returns {string}
 */
function getCurrentFallbackPrompt() {
  const config = getFeedbackConfig();
  const activeConfig = ScenarioService.getActive();

  if (activeConfig?.prompts) {
    // Try to get the specific prompt for this mode
    if (config.promptType === 'trainer' && activeConfig.prompts.trainer) {
      return activeConfig.prompts.trainer;
    }
    if (config.promptType === 'mentor' && activeConfig.prompts.mentor) {
      return activeConfig.prompts.mentor;
    }
  }

  // Fallback to APP_CONFIG.FALLBACK_PROMPTS
  if (APP_CONFIG.FALLBACK_PROMPTS) {
    const modeKey = config.promptType === 'trainer' ? 'transformation' : 'simulation';
    if (APP_CONFIG.FALLBACK_PROMPTS[modeKey]) {
      return APP_CONFIG.FALLBACK_PROMPTS[modeKey];
    }
  }

  // Ultimate fallback
  return getFallbackPrompt(config.promptType);
}

/**
 * Generates the input for AI analysis based on current mode.
 * @returns {string}
 */
function generateAnalysisInput() {
  const config = getFeedbackConfig();
  const activeConfig = ScenarioService.getActive();

  if (config.promptType === 'trainer' && STATE.answers && STATE.answers.length > 0) {
    // Transformation mode: use answers array
    return "Hier sind die Ergebnisse der Übung:\n\n" +
        STATE.answers.map((a, i) => `Aussage ${i+1}: "${a.statement}"\nAntwort: "${a.userResponse}"`).join("\n\n");
  } else if (activeConfig) {
    // Simulation mode: use chat transcript
    return `Gesprächsprotokoll:\n${Chat.getTranscript(activeConfig.roleName)}`;
  }

  return "Bitte analysiere dieses Gespräch.";
}

/**
 * Requests feedback from the AI and displays it in a modal.
 * @async
 */
export async function handleFeedback() {
  if (Chat.getMessageCount() === 0) return;
  const config = ScenarioService.getActive();
  if (!config || !config.prompts) return;

  const feedbackConfig = getFeedbackConfig();
  const finalPrompt = getCurrentFallbackPrompt();

  // Update loading UI
  if (UI.elements.loadingTitle) {
    UI.elements.loadingTitle.textContent = FEEDBACK_MESSAGES.loading.title[feedbackConfig.loadingTitleKey];
  }
  UI.elements.loadingOverlay?.classList.remove("hidden");
  UI.updateStatus("loading", FEEDBACK_MESSAGES.loading.status[feedbackConfig.loadingTitleKey]);

  const inputForAnalysis = generateAnalysisInput();

  try {
    const data = await API.callChatApi(
        [
          { role: "system", content: finalPrompt },
          { role: "user", content: inputForAnalysis },
        ],
        {
          proxyUrl: APP_CONFIG.PROXY_URL,
          model: APP_CONFIG.MODEL,
          temperature: APP_CONFIG.COACH_TEMPERATURE,
        },
    );

    if (data) {
      const feedback = data.choices[0].message.content;
      STATE.lastFeedback = feedback;

      if (UI.elements.feedbackModalTitle) {
        UI.elements.feedbackModalTitle.innerHTML = FEEDBACK_MESSAGES.modal.title[feedbackConfig.modalTitleKey];
      }
      UI.showFeedbackModal(feedback);

      if (STATE.ttsEnabled) {
        UI.speak(feedback, FEEDBACK_MESSAGES.tts[feedbackConfig.ttsKey]);
      }

      UI.elements.feedbackBtn?.classList.add("hidden");
      if (UI.elements.exportTranscriptBtn) {
        UI.elements.exportTranscriptBtn.classList.remove("hidden");
      }
      UI.updateStatus("idle", FEEDBACK_MESSAGES.status.ready);
    } else {
      UI.updateStatus("error", FEEDBACK_MESSAGES.status.error);
    }
  } catch (e) {
    console.error("Feedback request failed:", e);
    const errorText = e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e));
    UI.updateStatus("error", FEEDBACK_MESSAGES.errorPrefix + errorText);
  } finally {
    UI.elements.loadingOverlay.classList.add("hidden");
  }
}

/**
 * Closes the feedback modal.
 * @async
 */
export async function closeFeedbackModal() {
  const modal = UI.elements.feedbackModal;
  if (modal) modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  await confirmReset();
}

/**
 * Confirms reset and returns to appropriate mode.
 * @async
 */
export async function confirmReset() {
  // Close reset modal
  const resetModal = UI.elements.resetModal || document.getElementById("reset-modal");
  if (resetModal) resetModal.classList.add("hidden");

  // End current conversation and WAIT for upload to complete
  await DataLogger.endConversation();

  // Determine which reset function to call
  const feedbackConfig = getFeedbackConfig();
  const resetFunctionName = feedbackConfig.resetFunction;

  // Try window function first
  if (typeof window[resetFunctionName] === 'function') {
    await window[resetFunctionName]();
  }
  // Fallback for transformation mode
  else if (resetFunctionName === 'restartTransformationExercise' &&
      typeof window.restartTransformationExercise === 'function') {
    window.restartTransformationExercise();
  }
  // Fallback for simulation mode
  else if (typeof window.switchToRoleplayMode === 'function') {
    await window.switchToRoleplayMode();
  }
  // Ultimate fallback: reload current scenario
  else {
    const active = ScenarioService.getActive();
    if (active && active.id && typeof window.loadContent === 'function') {
      await window.loadContent(active.id);
    }
  }
}

// Make globally available for onclick attributes
window.handleFeedback = handleFeedback;
window.closeFeedbackModal = closeFeedbackModal;
window.confirmReset = confirmReset;
window.closeResetModal = confirmReset;