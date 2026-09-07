/**
 * @module WindowHandlers
 * Global window handler functions for UI updates.
 * These functions are bound to the window object for HTML onclick compatibility.
 * Dynamic version that works with all path configurations.
 */

let DIALOGUE_LAB_CONFIG = typeof window !== 'undefined' ? (window.DIALOGUE_LAB_CONFIG || {}) : {};

/**
 * Updates the subtitle text based on screen width.
 * Provides a hint for mobile users on how to access the menu.
 * Dynamic version that adapts to the current path configuration.
 * @returns {void}
 */
export function updateSubtitleText() {
  const sub = document.getElementById("main-subtitle");
  if (!sub) return;

  const config = DIALOGUE_LAB_CONFIG || {};
  const isPracticeMode = config.ALLOWED_MODES && config.ALLOWED_MODES.includes('TRANSFORMATION');
  const isMobile = window.innerWidth < 1024;

  // Dynamic base text based on mode
  const baseText = isPracticeMode
      ? "Wähle eine Übung aus, um zu starten."
      : "Wähle ein Szenario aus, um zu starten.";

  // Dynamic hint text based on mode
  const hintText = isPracticeMode
      ? "Übung wechseln? Klicke oben rechts auf ☰"
      : "Szenario wechseln? Klicke oben rechts auf ☰";

  sub.innerHTML = isMobile
      ? `${baseText} <br><span class="text-xs text-blue-600">${hintText}</span>`
      : baseText;
}

// Auto-bind to window for HTML onclick compatibility
window.updateSubtitleText = updateSubtitleText;