const STORAGE_KEY = 'hema-saved-combos';

/**
 * Service to abstract storage layer.
 * All functions are async to prepare for future BaaS (Supabase/Firebase) integration.
 */
export const storageService = {
  /**
   * Fetches all saved user combos.
   * @returns {Promise<Array>} Array of combo objects.
   */
  async getCombos() {
    return new Promise((resolve) => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        resolve(raw ? JSON.parse(raw) : []);
      } catch (error) {
        console.error("Storage Error - getCombos: ", error);
        resolve([]);
      }
    });
  },

  /**
   * Saves a single combo to the storage list.
   * @param {Object} combo The combo object to save.
   * @returns {Promise<void>}
   */
  async saveCombo(combo) {
    return new Promise((resolve) => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const combos = raw ? JSON.parse(raw) : [];
        combos.push(combo);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combos));
        resolve();
      } catch (error) {
        console.error("Storage Error - saveCombo: ", error);
        resolve();
      }
    });
  },

  /**
   * Deletes a combo from the storage list by ID.
   * @param {string} comboId The ID of the combo to delete.
   * @returns {Promise<void>}
   */
  async deleteCombo(comboId) {
    return new Promise((resolve) => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const combos = JSON.parse(raw);
          const filtered = combos.filter(c => c.id !== comboId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
        resolve();
      } catch (error) {
        console.error("Storage Error - deleteCombo: ", error);
        resolve();
      }
    });
  }
};
