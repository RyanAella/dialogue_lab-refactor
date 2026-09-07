/**
 * @module State
 * Centralized application state management for Dialogue Lab.
 * Dynamic version that works with path-based configuration (practice-edition, simulation-lab, full).
 */

import { APP_MODES } from "./config.js";
import { Chat } from "../features/chat.js";
import { UI } from "../ui/ui.js";

const DIALOGUE_LAB_CONFIG = typeof window !== 'undefined' ? (window.DIALOGUE_LAB_CONFIG || {}) : {};

/**
 * Global application state.
 * Holds runtime data that changes during a session.
 * Initial mode is set dynamically based on path configuration.
 */
export let STATE = {
  answers: [],
  // Dynamic initialization: use DEFAULT_MODE from config, fallback to SIMULATION
  currentMode: (DIALOGUE_LAB_CONFIG?.DEFAULT_MODE?.toLowerCase() ||
      DIALOGUE_LAB_CONFIG?.ALLOWED_MODES?.[0]?.toLowerCase() ||
      APP_MODES.SIMULATION),
  exerciseIndex: 0,
  activeStatements: [],
  ttsEnabled: false,
  lastFeedback: null,
};

// Make STATE globally available for legacy compatibility
window.STATE = STATE;

/**
 * Resets the common state properties.
 */
export function resetState() {
  STATE.exerciseIndex = 0;
  STATE.answers = [];
  STATE.lastFeedback = null;
  Chat.clear();
}

/**
 * Resets the UI elements for chat and sidebar.
 */
export function resetUI() {
  // Clear chat window safely (check if exists)
  if (UI.elements.chatWindow) {
    UI.elements.chatWindow.innerHTML = "";
  }

  // Hide export button if it exists
  if (UI.elements.exportTranscriptBtn) {
    UI.elements.exportTranscriptBtn.classList.add("hidden");
  }

  resetSidebarButtons();
}

/**
 * Resets the sidebar action buttons to their initial disabled state.
 * Works for all path configurations.
 */
export function resetSidebarButtons() {
  const btn = UI.elements.feedbackBtn;
  if (btn) {
    btn.classList.remove("hidden");
    btn.disabled = true;
    btn.classList.add("opacity-50", "cursor-not-allowed");
  }
  if (UI.elements.resetBtn) {
    UI.elements.resetBtn.disabled = true;
    UI.elements.resetBtn.classList.add("opacity-50", "cursor-not-allowed");
  }
}

/**
 * Enables the sidebar action buttons (feedback and reset).
 */
export function enableSidebarButtons() {
  [UI.elements.feedbackBtn, UI.elements.resetBtn].forEach((btn) => {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("opacity-50", "cursor-not-allowed");
    }
  });
}

/**
 * Sets the visibility of exercise action buttons in the sidebar.
 * Safe check for UI method existence (used in practice-edition).
 * @param {boolean} visible - Whether the actions should be visible.
 */
export function setExerciseActionsVisible(visible) {
  if (UI && typeof UI.setExerciseActionsVisible === 'function') {
    UI.setExerciseActionsVisible(visible);
  }
}