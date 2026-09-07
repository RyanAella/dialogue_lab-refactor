/**
 * @module Dropdowns
 * Handles dropdown initialization for scenarios and exercises.
 * Dynamic version that works with all path configurations.
 */

import { UI } from "../ui/ui.js";
import { API } from "../services/api.js";
import { ScenarioService } from "../features/scenario.js";
import { EXERCISE_TYPES, UI_TEXTS } from "../core/config.js";

/**
 * Determines the appropriate file path for a given exercise type.
 * @param {Object} ex - The exercise object
 * @returns {string} The file path to use
 */
function getExerciseFilePath(ex) {
  if (!ex || !ex.config) return null;

  // For transformation exercises, use instructionFile
  if (ex.type === EXERCISE_TYPES.TRANSFORMATION) {
    return ex.config.instructionFile;
  }
  // For simulation exercises, use scenarioFile
  return ex.config.scenarioFile || ex.config.instructionFile;
}

/**
 * Generic helper to populate a <select> element with options from the exercise pool.
 * Fetches scenario titles asynchronously to display user-friendly names.
 *
 * @async
 * @param {string} type - The exercise type to filter by (EXERCISE_TYPES.SIMULATION or EXERCISE_TYPES.TRANSFORMATION).
 * @param {HTMLSelectElement} selectElement - The target dropdown element.
 * @param {string} placeholder - The default disabled option text.
 */
async function initDropdown(type, selectElement, placeholder) {
  console.log('[DEBUG] initDropdown called for type:', type, 'element:', selectElement?.id);
  if (!selectElement) {
    console.error('[DEBUG] initDropdown: selectElement is null/undefined');
    return;
  }

  selectElement.innerHTML = `<option value="" selected disabled>${placeholder}</option>`;
  const filtered = ScenarioService.getExercisesByType(type);
  console.log('[DEBUG] initDropdown: filtered exercises for', type, ':', filtered.length);

  if (filtered.length === 0) {
    console.error('[DEBUG] initDropdown: No exercises found for type:', type);
    selectElement.innerHTML = `<option value="" disabled>${UI_TEXTS.errors.noEntriesAvailable}</option>`;
    selectElement.disabled = true;
    return;
  }

  console.log('[DEBUG] initDropdown: Loading titles for', filtered.length, 'exercises');
  
  // Basis-Pfad für korrekte Pfadauflösung
  const basePath = (typeof window !== 'undefined' ? window.DIALOGUE_LAB_CONFIG.BASE_PATH : '') || '';
  
  for (const ex of filtered) {
    try {
      let filePath = getExerciseFilePath(ex);
      if (filePath) {
        // Entferne führenden / und füge basePath davor an
        const cleanFilePath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
        filePath = `${basePath}${cleanFilePath}`;
      }
      console.log('[DEBUG] initDropdown: Loading title for exercise:', ex.id, 'from file:', filePath);
      const title = filePath ? (await API.fetchScenarioTitle(filePath)) || ex.id : ex.id;
      selectElement.add(new Option(title, ex.id));
      console.log('[DEBUG] initDropdown: Added exercise:', ex.id, 'with title:', title);
    } catch (e) {
      console.error('[DEBUG] Metadata load error for', ex.id, ':', e);
      selectElement.add(new Option(ex.id, ex.id)); // Fallback: zeige wenigstens die ID an
    }
  }
  selectElement.disabled = false;
  console.log('[DEBUG] initDropdown: Completed for type:', type);
}

/**
 * Initializes the simulation scenario dropdown.
 * @async
 */
export async function initScenarioDropdown() {
  console.log('[DEBUG] initScenarioDropdown called');
  await initDropdown(
      EXERCISE_TYPES.SIMULATION,
      UI.elements.scenarioSelect,
      UI_TEXTS.input.chooseScenario || "Wähle ein Szenario...",
  );
  console.log('[DEBUG] initScenarioDropdown completed');
}

/**
 * Initializes the transformation exercise dropdown.
 * @async
 */
export async function initExerciseDropdown() {
  console.log('[DEBUG] initExerciseDropdown called');
  await initDropdown(
      EXERCISE_TYPES.TRANSFORMATION,
      UI.elements.exerciseSelect,
      UI_TEXTS.input.chooseExercise || "Wähle eine Übung...",
  );
  console.log('[DEBUG] initExerciseDropdown completed');
}