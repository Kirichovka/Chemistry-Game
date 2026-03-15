import { saveKey } from '../utils/constants.js';

export function createSaveManager() {
  function loadGame() {
    const saved = localStorage.getItem(saveKey);
    if (!saved) {
      return null;
    }

    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }

  function saveGame(state) {
    localStorage.setItem(saveKey, JSON.stringify(state));
  }

  function clearGame() {
    localStorage.removeItem(saveKey);
  }

  return {
    loadGame,
    saveGame,
    clearGame,
  };
}
