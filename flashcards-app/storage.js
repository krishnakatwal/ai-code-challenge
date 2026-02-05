/**
 * Storage Module - Persistent state management with versioning and safe parsing
 * Handles localStorage operations with fallback, version control, and data migration
 */

const StorageConfig = {
  STORAGE_KEY: "flashcards_app_state",
  VERSION: 1,
  DEBOUNCE_DELAY: 300, // milliseconds
};

/**
 * StorageManager - Handles all persistent state operations
 */
class StorageManager {
  constructor() {
    this.version = StorageConfig.VERSION;
    this.storageKey = StorageConfig.STORAGE_KEY;
    this.migrationStrategies = {
      1: (data) => this.migrateToV1(data),
    };
  }

  /**
   * Load state from localStorage with version checking and safe parsing
   * Returns default state if parsing fails or storage is unavailable
   * @returns {Object} Parsed state or default empty state
   */
  loadState() {
    try {
      // Check if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        console.warn("localStorage not available, using in-memory storage");
        return this.getDefaultState();
      }

      const rawData = localStorage.getItem(this.storageKey);

      // No data stored yet
      if (!rawData) {
        return this.getDefaultState();
      }

      // Attempt to parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(rawData);
      } catch (parseError) {
        console.error(
          "Failed to parse stored state, using default state",
          parseError,
        );
        return this.getDefaultState();
      }

      // Validate data structure
      if (!this.isValidStateStructure(parsedData)) {
        console.warn("Invalid state structure, using default state");
        return this.getDefaultState();
      }

      // Handle version migration if needed
      if (parsedData.version !== this.version) {
        console.log(
          `Migrating state from v${parsedData.version} to v${this.version}`,
        );
        parsedData = this.migrateState(parsedData);
      }

      // IMPORTANT: Return a deep clone to prevent mutations affecting stored state
      // This ensures that modifications to returned data don't corrupt localStorage
      return JSON.parse(JSON.stringify(parsedData));
    } catch (error) {
      console.error("Unexpected error loading state:", error);
      return this.getDefaultState();
    }
  }

  /**
   * Save state to localStorage with version info
   * Includes error handling and fallback to in-memory storage
   * IMPORTANT: Caller should pass in the current state; this method does NOT mutate the input
   * @param {Object} state - Application state to save (will be serialized, not modified)
   * @returns {boolean} True if save successful, false otherwise
   */
  saveState(state) {
    try {
      // Check if localStorage is available
      if (!this.isLocalStorageAvailable()) {
        console.warn("localStorage not available, state not persisted");
        return false;
      }

      // Create a new object with version info (does not mutate input state)
      // Use shallow spread to avoid modifying the original state object
      const stateWithVersion = {
        ...state,
        version: this.version,
        savedAt: new Date().toISOString(),
      };

      // Validate state before saving
      if (!this.isValidStateStructure(stateWithVersion)) {
        console.error("Invalid state structure, not saving");
        return false;
      }

      // Attempt to stringify and save
      const serialized = JSON.stringify(stateWithVersion);

      // Check storage quota before saving (rough estimate)
      if (serialized.length > 5 * 1024 * 1024) {
        // 5MB limit
        console.warn(
          "State too large to save (" +
            Math.round(serialized.length / 1024) +
            "KB)",
        );
        return false;
      }

      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.error("localStorage quota exceeded, clearing old data");
        this.clearState();
        return false;
      }
      console.error("Failed to save state:", error);
      return false;
    }
  }

  /**
   * Clear all stored state
   * @returns {boolean} True if clear successful
   */
  clearState() {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem(this.storageKey);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to clear state:", error);
      return false;
    }
  }

  /**
   * Get default application state
   * @returns {Object} Default state structure
   */
  getDefaultState() {
    return {
      version: this.version,
      decks: [],
      selectedDeckId: null,
      searchQuery: "",
      savedAt: new Date().toISOString(),
    };
  }

  /**
   * Check if localStorage is available and accessible
   * @returns {boolean} True if localStorage is available
   */
  isLocalStorageAvailable() {
    try {
      const test = "__localStorage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate state structure matches expected schema
   * @param {Object} data - Data to validate
   * @returns {boolean} True if valid
   */
  isValidStateStructure(data) {
    return (
      data &&
      typeof data === "object" &&
      Array.isArray(data.decks) &&
      (data.selectedDeckId === null || typeof data.selectedDeckId === "number")
    );
  }

  /**
   * Migrate state from previous versions
   * @param {Object} data - State from previous version
   * @returns {Object} Migrated state
   */
  migrateState(data) {
    let migratedData = { ...data };
    const fromVersion = data.version || 0;

    // Run migration strategies for versions after current
    for (let v = fromVersion + 1; v <= this.version; v++) {
      if (this.migrationStrategies[v]) {
        migratedData = this.migrationStrategies[v](migratedData);
      }
    }

    migratedData.version = this.version;
    return migratedData;
  }

  /**
   * Migration strategy for version 1
   * Ensures all decks have required fields
   * @param {Object} data - Previous version data
   * @returns {Object} Migrated data
   */
  migrateToV1(data) {
    // Ensure decks have all required fields
    const migratedDecks = (data.decks || []).map((deck) => ({
      id: deck.id,
      name: deck.name || "Untitled Deck",
      cards: Array.isArray(deck.cards) ? deck.cards : [],
      createdAt: deck.createdAt || new Date().toISOString(),
    }));

    return {
      ...data,
      decks: migratedDecks,
      version: 1,
    };
  }

  /**
   * Export state as JSON for backup
   * @returns {string} JSON string of current state
   */
  exportState(state) {
    try {
      return JSON.stringify(state, null, 2);
    } catch (error) {
      console.error("Failed to export state:", error);
      return null;
    }
  }

  /**
   * Import state from JSON string
   * @param {string} jsonString - JSON string to import
   * @returns {Object|null} Imported state or null if invalid
   */
  importState(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      if (this.isValidStateStructure(imported)) {
        return imported;
      }
      console.error("Imported state has invalid structure");
      return null;
    } catch (error) {
      console.error("Failed to import state:", error);
      return null;
    }
  }
}

/**
 * SearchManager - Handles card searching with debouncing
 */
class SearchManager {
  constructor(debounceDelay = StorageConfig.DEBOUNCE_DELAY) {
    this.debounceDelay = debounceDelay;
    this.debounceTimer = null;
    this.lastQuery = "";
    this.searchCallback = null;
  }

  /**
   * Perform debounced search on cards
   * @param {Array} cards - Cards to search through
   * @param {string} query - Search query
   * @param {Function} callback - Callback with results(filteredCards, matchCount)
   */
  search(cards, query, callback) {
    this.searchCallback = callback;

    // Clear previous debounce timer
    clearTimeout(this.debounceTimer);

    // If query is empty, return all cards
    if (!query || query.trim() === "") {
      this.debounceTimer = setTimeout(() => {
        callback(cards, cards.length);
      }, this.debounceDelay);
      return;
    }

    // Set new debounce timer
    this.debounceTimer = setTimeout(() => {
      const filteredCards = this.filterCards(cards, query);
      callback(filteredCards, filteredCards.length);
    }, this.debounceDelay);
  }

  /**
   * Filter cards by search query
   * Searches both front and back content, case-insensitive
   * @param {Array} cards - Cards to search
   * @param {string} query - Search query
   * @returns {Array} Filtered cards
   */
  filterCards(cards, query) {
    const normalizedQuery = query.toLowerCase().trim();

    return cards.filter((card) => {
      const front = (card.front || "").toLowerCase();
      const back = (card.back || "").toLowerCase();

      return front.includes(normalizedQuery) || back.includes(normalizedQuery);
    });
  }

  /**
   * Get search stats
   * @param {Array} cards - Original cards
   * @param {Array} filtered - Filtered results
   * @returns {Object} Stats object
   */
  getSearchStats(cards, filtered) {
    return {
      total: cards.length,
      matches: filtered.length,
      percentage:
        cards.length > 0
          ? Math.round((filtered.length / cards.length) * 100)
          : 0,
    };
  }

  /**
   * Cancel pending search
   */
  cancel() {
    clearTimeout(this.debounceTimer);
  }

  /**
   * Clear search state
   */
  clear() {
    this.lastQuery = "";
    clearTimeout(this.debounceTimer);
  }
}

/**
 * Create singleton instances for module export
 */
const storage = new StorageManager();
const search = new SearchManager();

/**
 * Export module functions (if using modules)
 */
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    storage,
    search,
    StorageManager,
    SearchManager,
    StorageConfig,
  };
}
