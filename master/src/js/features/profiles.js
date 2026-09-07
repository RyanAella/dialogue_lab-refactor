/**
 * @module Profiles
 * Maps scenario role labels to specific character pools.
 * Dynamic version that works with all path configurations.
 */

import { ALL_CHARACTERS, FEMALE_CHARACTERS, MALE_CHARACTERS } from "../../data/characters.js";

/**
 * @typedef {Object} CharacterProfile
 * @property {string} gender - The gender of the character ('male' or 'female').
 * @property {string} basePath - The base path for asset resolution.
 * @property {string[]} heads - Array of paths for head/face base images.
 * @property {string[]} clothes - Array of paths for clothing layers.
 * @property {string[]} hair - Array of paths for hairstyle layers.
 * @property {string[]} glasses - Array of paths for eyewear (or empty strings for none).
 * @property {string[]} headset - Array of paths for headset/communication gear.
 * @property {Object.<string, string[]>|string[]} hands - Hand images, either as a simple array or mapped by skin tone (a, b, c, d).
 * @property {string[]} eyesOpen - Array of paths for open eye states.
 * @property {string[]} eyesClosed - Array of paths for closed eye states (blinking).
 * @property {string[]} mouthsClosed - Array of paths for neutral/closed mouth states.
 * @property {string[]} mouthsOpen - Array of paths for open/speaking mouth states.
 */

/**
 * Maps scenario role labels to specific character pools.
 * The key corresponds to the 'role_label' or 'roleName' defined in the scenario text files.
 * Uses ALL_CHARACTERS for Teammitglied to cover both practice-edition and simulation-lab configurations.
 * @type {Object.<string, CharacterProfile[]>}
 */
export const CHARACTER_PROFILES = {
  // Female roles
  Mitarbeiterin: FEMALE_CHARACTERS,
  Kollegin: FEMALE_CHARACTERS,

  // Male roles
  Mitarbeiter: MALE_CHARACTERS,
  Kollege: MALE_CHARACTERS,

  // Neutral roles (use ALL_CHARACTERS for maximum compatibility)
  Teammitglied: ALL_CHARACTERS,
  Coach: ALL_CHARACTERS,

  // Fallback for any role not explicitly defined
  default: ALL_CHARACTERS,
};

/**
 * Retrieves the appropriate character profile pool based on a role key.
 * Falls back to the global 'default' pool if the key is not found.
 * @param {string} key - The role name or label to look up.
 * @returns {CharacterProfile[]} An array of character profiles matching the role.
 */
export const getProfilePool = (key) => {
  return CHARACTER_PROFILES[key] || CHARACTER_PROFILES["default"];
};