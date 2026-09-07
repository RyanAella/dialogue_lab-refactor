/**
 * @module Dropdowns
 * Handles dropdown initialization for scenarios and exercises.
 * Dynamic version that works with all path configurations.
 */

import { UI } from "../ui/ui.js";
import { API } from "../services/api.js";
import { ScenarioService } from "../features/scenario.js";
import { EXERCISE_TYPES, UI_TEXTS, DIALOGUE_LAB_CONFIG } from "../core/config.js";

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
  if (!selectElement) return;

  selectElement.innerHTML = `<option value="" selected disabled>${placeholder}</option>`;
  const filtered = ScenarioService.getExercisesByType(type);

  if (filtered.length === 0) {
    selectElement.innerHTML = `<option value="" disabled>${UI_TEXTS.errors.noEntriesAvailable}</option>`;
    selectElement.disabled = true;
    return;
  }

  for (const ex of filtered) {
    try {
      const filePath = getExerciseFilePath(ex);
      const title = filePath ? (await API.fetchScenarioTitle(filePath)) || ex.id : ex.id;
      selectElement.add(new Option(title, ex.id));
    } catch (e) {
      console.error(`Metadata load error for ${ex.id}:`, e);
    }
  }
  selectElement.disabled = false;
}

/**
 * Initializes the simulation scenario dropdown.
 * @async
 */
export async function initScenarioDropdown() {
  await initDropdown(
      EXERCISE_TYPES.SIMULATION,
      UI.elements.scenarioSelect,
      UI_TEXTS.input.chooseScenario || "Wähle ein Szenario...",
  );
}

/**
 * Initializes the transformation exercise dropdown.
 * @async
 */
export async function initExerciseDropdown() {
  await initDropdown(
      EXERCISE_TYPES.TRANSFORMATION,
      UI.elements.exerciseSelect,
      UI_TEXTS.input.chooseExercise || "Wähle eine Übung...",
  );
}