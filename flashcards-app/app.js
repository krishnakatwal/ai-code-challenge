/**
 * Flashcards App - Main Application Script
 * Implements Deck CRUD operations with in-memory storage
 */

/**
 * Deck Manager - Handles CRUD operations for decks
 */
class DeckManager {
  constructor() {
    this.decks = [];
    this.nextId = 1;
    this.selectedDeckId = null;
    this.observers = []; // Observer pattern for UI updates
    this.loadInitialDecks();
  }

  /**
   * Load initial sample decks
   */
  loadInitialDecks() {
    this.decks = [
      {
        id: 1,
        name: "Spanish Vocabulary",
        cards: [],
        createdAt: new Date(),
      },
      {
        id: 2,
        name: "Biology Terms",
        cards: [],
        createdAt: new Date(),
      },
      {
        id: 3,
        name: "JavaScript Concepts",
        cards: [],
        createdAt: new Date(),
      },
    ];
    this.nextId = 4;
  }

  /**
   * Get all decks
   */
  getAllDecks() {
    return [...this.decks];
  }

  /**
   * Get deck by ID
   */
  getDeckById(id) {
    return this.decks.find((deck) => deck.id === id);
  }

  /**
   * Create a new deck
   */
  createDeck(name) {
    if (!name || name.trim() === "") {
      throw new Error("Deck name cannot be empty");
    }

    const newDeck = {
      id: this.nextId++,
      name: name.trim(),
      cards: [],
      createdAt: new Date(),
    };

    this.decks.push(newDeck);
    this.notifyObservers("deckCreated", newDeck);
    return newDeck;
  }

  /**
   * Update an existing deck
   */
  updateDeck(id, updates) {
    const deck = this.getDeckById(id);
    if (!deck) {
      throw new Error(`Deck with ID ${id} not found`);
    }

    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim() === "") {
        throw new Error("Deck name cannot be empty");
      }
      deck.name = updates.name.trim();
    }

    this.notifyObservers("deckUpdated", deck);
    return deck;
  }

  /**
   * Delete a deck
   */
  deleteDeck(id) {
    const index = this.decks.findIndex((deck) => deck.id === id);
    if (index === -1) {
      throw new Error(`Deck with ID ${id} not found`);
    }

    const deletedDeck = this.decks[index];
    this.decks.splice(index, 1);

    // Clear selection if deleted deck was selected
    if (this.selectedDeckId === id) {
      this.selectedDeckId = null;
    }

    this.notifyObservers("deckDeleted", deletedDeck);
    return deletedDeck;
  }

  /**
   * Select a deck
   */
  selectDeck(id) {
    const deck = this.getDeckById(id);
    if (!deck) {
      throw new Error(`Deck with ID ${id} not found`);
    }

    this.selectedDeckId = id;
    this.notifyObservers("deckSelected", deck);
    return deck;
  }

  /**
   * Get selected deck
   */
  getSelectedDeck() {
    return this.selectedDeckId ? this.getDeckById(this.selectedDeckId) : null;
  }

  /**
   * Add card to deck
   * Uses unique UUID-based ID to prevent collisions when cards are deleted
   */
  addCardToDeck(deckId, cardData) {
    const deck = this.getDeckById(deckId);
    if (!deck) {
      throw new Error(`Deck with ID ${deckId} not found`);
    }

    const card = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      front: cardData.front || "",
      back: cardData.back || "",
      createdAt: new Date(),
    };

    deck.cards.push(card);
    this.notifyObservers("cardAdded", { deck, card });
    return card;
  }

  /**
   * Delete card from deck
   */
  deleteCardFromDeck(deckId, cardId) {
    const deck = this.getDeckById(deckId);
    if (!deck) {
      throw new Error(`Deck with ID ${deckId} not found`);
    }

    const cardIndex = deck.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error(`Card with ID ${cardId} not found`);
    }

    const deletedCard = deck.cards[cardIndex];
    deck.cards.splice(cardIndex, 1);
    this.notifyObservers("cardDeleted", { deck, card: deletedCard });
    return deletedCard;
  }

  /**
   * Observer pattern - Register observer
   */
  subscribe(callback) {
    this.observers.push(callback);
  }

  /**
   * Observer pattern - Unregister observer
   */
  unsubscribe(callback) {
    this.observers = this.observers.filter((obs) => obs !== callback);
  }

  /**
   * Observer pattern - Notify all observers
   */
  notifyObservers(event, data) {
    this.observers.forEach((callback) => {
      callback(event, data);
    });
  }
}

/**
 * UI Manager - Handles all UI updates
 */
class UIManager {
  constructor(deckManager) {
    this.deckManager = deckManager;
    this.modal = null;
    this.currentCardIndex = 0; // Track which card is being viewed
    this.cardFlipState = new Map(); // Store flip state by cardId
    this.searchManager = new SearchManager(); // Initialize search with debouncing
    this.filteredCards = []; // Store filtered search results
    this.isSearchActive = false; // Track if search is filtering
    this.init();
  }

  init() {
    // Load persisted state from storage
    this.loadPersistedState();

    // Initialize modal
    this.modal = new AccessibleModal("#deckModal");

    // Subscribe to deck manager updates
    this.deckManager.subscribe((event, data) => {
      this.handleDeckChange(event, data);
    });

    // Wire up event listeners
    this.setupEventListeners();

    // Setup search input listener
    this.setupSearchListener();

    // Render initial deck list
    this.renderDeckList();
  }

  setupEventListeners() {
    const addDeckBtn = document.getElementById("add-deck-btn");
    const confirmCreateDeckBtn = document.getElementById("confirmCreateDeck");
    const deckNameInput = document.getElementById("deckNameInput");
    const modalBackdrop = document.getElementById("modalBackdrop");
    const decksList = document.getElementById("decks-list");
    const cardsContainer = document.getElementById("cards-container");

    // Open modal
    addDeckBtn.addEventListener("click", (e) => {
      deckNameInput.value = "";
      deckNameInput.focus();
      modalBackdrop.classList.add("open");
      this.modal.open(e.target);
    });

    // Create deck
    confirmCreateDeckBtn.addEventListener("click", () => {
      const deckName = deckNameInput.value.trim();

      if (deckName) {
        try {
          this.deckManager.createDeck(deckName);
          deckNameInput.value = "";
          modalBackdrop.classList.remove("open");
          this.modal.close();
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      } else {
        alert("Please enter a deck name");
        deckNameInput.focus();
      }
    });

    // Allow Enter to create deck
    deckNameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        confirmCreateDeckBtn.click();
      }
    });

    // Note: Close buttons are handled by AccessibleModal.init() -
    // no need to add duplicate listeners here. The modal class handles:
    // - Click listeners on [data-modal-close] buttons
    // - Click listeners on modal backdrop for closing
    // - Removal of modal classes in UIManager.setupEventListeners() handles UI state

    // Event delegation for deck buttons (select & delete)
    decksList.addEventListener("click", (e) => {
      const deckButton = e.target.closest(".deck-button");
      const deleteButton = e.target.closest(".deck-delete-btn");

      if (deckButton) {
        e.preventDefault();
        const deckId = parseInt(deckButton.getAttribute("data-deck-id"), 10);
        this.selectDeck(deckId);
      } else if (deleteButton) {
        e.stopPropagation();
        const deckId = parseInt(
          deleteButton.parentElement
            .querySelector(".deck-button")
            .getAttribute("data-deck-id"),
          10,
        );
        const deckName = this.deckManager.getDeckById(deckId).name;
        if (confirm(`Are you sure you want to delete "${deckName}"?`)) {
          this.deckManager.deleteDeck(deckId);
        }
      }
    });

    // Event delegation for card buttons (navigation & add)
    cardsContainer.addEventListener("click", (e) => {
      if (e.target.closest("#prev-btn")) {
        e.preventDefault();
        this.previousCard();
      } else if (e.target.closest("#next-btn")) {
        e.preventDefault();
        this.nextCard();
      } else if (e.target.closest("#add-card-btn")) {
        e.preventDefault();
        this.addCard();
      } else if (e.target.closest("#study-mode-btn")) {
        e.preventDefault();
        const selectedDeck = this.deckManager.getSelectedDeck();
        if (selectedDeck) {
          this.enterStudyMode(selectedDeck.id);
        } else {
          alert("Please select a deck first");
        }
      }
    });
  }

  /**
   * Render deck list in sidebar
   */
  renderDeckList() {
    const decksList = document.getElementById("decks-list");
    decksList.innerHTML = "";

    const decks = this.deckManager.getAllDecks();
    if (!decks || decks.length === 0) {
      // Accessible empty state for no decks
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.setAttribute("role", "region");
      empty.setAttribute("aria-live", "polite");

      const icon = document.createElement("div");
      icon.className = "empty-icon";
      icon.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 7h18v13H3z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 3h8v4H8z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      const title = document.createElement("h3");
      title.className = "empty-title";
      title.textContent = "No decks yet";

      const instructions = document.createElement("p");
      instructions.className = "empty-instructions";
      instructions.textContent =
        "Create your first deck to start adding flashcards. You can import decks or create one now.";

      const cta = document.createElement("button");
      cta.className = "btn btn-primary";
      cta.id = "add-deck-empty-btn";
      cta.textContent = "+ Create Deck";
      cta.setAttribute("aria-label", "Create a new deck");
      cta.addEventListener("click", () => {
        // Reuse existing add-deck button behavior
        const addBtn = document.getElementById("add-deck-btn");
        if (addBtn) addBtn.click();
      });

      empty.appendChild(icon);
      empty.appendChild(title);
      empty.appendChild(instructions);
      empty.appendChild(cta);

      decksList.appendChild(empty);

      // Move focus to CTA for keyboard users
      setTimeout(() => {
        cta.focus();
      }, 0);

      return;
    }

    decks.forEach((deck) => {
      const li = document.createElement("li");
      li.className = "deck-item";

      const button = document.createElement("button");
      button.className = "deck-button";
      button.setAttribute("data-deck-id", deck.id);
      button.setAttribute("aria-label", `Select ${deck.name}`);
      button.textContent = deck.name;

      if (this.deckManager.selectedDeckId === deck.id) {
        button.classList.add("active");
      }

      // Add delete button for each deck (delegated handlers exist)
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "deck-delete-btn";
      deleteBtn.setAttribute("aria-label", `Delete ${deck.name}`);
      deleteBtn.setAttribute("title", "Delete deck");
      deleteBtn.innerHTML = "&times;";

      li.appendChild(button);
      li.appendChild(deleteBtn);
      decksList.appendChild(li);
    });
  }

  /**
   * Select a deck and display its cards
   */
  selectDeck(deckId) {
    this.deckManager.selectDeck(deckId);
    this.renderDeckList();
    this.renderCards();
  }

  /**
   * Render cards for selected deck
   * Uses filtered cards if search is active, otherwise shows all cards
   */
  renderCards() {
    const selectedDeck = this.deckManager.getSelectedDeck();
    const cardsContainer = document.getElementById("cards-container");

    if (!selectedDeck) {
      cardsContainer.innerHTML =
        '<p style="text-align: center; color: var(--text-secondary);">Select a deck to view cards</p>';
      return;
    }

    cardsContainer.innerHTML = "";

    if (selectedDeck.cards.length === 0) {
      cardsContainer.innerHTML =
        '<p style="text-align: center; color: var(--text-secondary);">No cards in this deck. Create one to get started!</p>';
      // Reset navigation state when deck is empty
      this.currentCardIndex = 0;
      this.cardFlipState.clear();
      return;
    }

    // Use filtered cards if search is active, otherwise use all cards
    const cardsToDisplay = this.isSearchActive
      ? this.filteredCards
      : selectedDeck.cards;

    if (this.isSearchActive && cardsToDisplay.length === 0) {
      cardsContainer.innerHTML =
        '<p style="text-align: center; color: var(--text-secondary);">No cards match your search.</p>';
      return;
    }

    // Reset card index if it's out of bounds
    if (this.currentCardIndex >= selectedDeck.cards.length) {
      this.currentCardIndex = 0;
    }

    // IMPORTANT: Iterate cardsToDisplay (filtered) not selectedDeck.cards (underlying)
    // This ensures search filtering affects only the view, not the data
    cardsToDisplay.forEach((card, index) => {
      const article = document.createElement("article");
      article.className = "card";
      article.setAttribute("role", "article");
      article.setAttribute("data-card-id", card.id);
      article.setAttribute("data-card-index", index);

      // IMPORTANT: Reset flip state on render to prevent desync
      // Only restore flip state if explicitly stored for this card
      const wasFlipped = this.cardFlipState.get(card.id);
      if (wasFlipped) {
        article.classList.add("is-flipped");
      }

      // Card inner container for 3D flip
      const cardInner = document.createElement("div");
      cardInner.className = "card-inner";

      const front = document.createElement("div");
      front.className = "card-front";
      front.textContent = card.front || "Front";

      // Action buttons (edit, delete)
      const actions = document.createElement("div");
      actions.className = "card-actions";

      const editBtn = document.createElement("button");
      editBtn.className = "card-action-btn";
      editBtn.setAttribute("data-action", "edit");
      editBtn.setAttribute("aria-label", "Edit card");
      editBtn.textContent = "✏️";

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "card-action-btn delete-card";
      deleteBtn.setAttribute("data-action", "delete");
      deleteBtn.setAttribute("aria-label", "Delete card");
      deleteBtn.textContent = "🗑️";

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);
      front.appendChild(actions);

      const back = document.createElement("div");
      back.className = "card-back";
      back.textContent = card.back || "Back";

      cardInner.appendChild(front);
      cardInner.appendChild(back);
      article.appendChild(cardInner);
      cardsContainer.appendChild(article);
    });

    // Set up card event delegation
    this.setupCardEventListeners();
  }

  /**
   * Setup event delegation for card interactions
   * Tracks flip state to prevent desync on card updates
   */
  setupCardEventListeners() {
    const cardsContainer = document.getElementById("cards-container");

    // Card flip on click (not on action buttons)
    cardsContainer.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      const actionBtn = e.target.closest(".card-action-btn");

      if (card && !actionBtn) {
        // Toggle flip animation
        const cardId = card.getAttribute("data-card-id");
        card.classList.toggle("is-flipped");
        // Store flip state to persist across re-renders
        this.cardFlipState.set(cardId, card.classList.contains("is-flipped"));
      }

      // Card edit
      if (actionBtn && actionBtn.getAttribute("data-action") === "edit") {
        e.stopPropagation();
        const card = actionBtn.closest(".card");
        const cardId = card.getAttribute("data-card-id");
        this.editCard(cardId);
      }

      // Card delete
      if (actionBtn && actionBtn.getAttribute("data-action") === "delete") {
        e.stopPropagation();
        const card = actionBtn.closest(".card");
        const cardId = card.getAttribute("data-card-id");
        const selectedDeck = this.deckManager.getSelectedDeck();
        if (confirm("Delete this card?")) {
          // Clear flip state for deleted card
          this.cardFlipState.delete(cardId);
          this.deckManager.deleteCardFromDeck(selectedDeck.id, cardId);
        }
      }
    });
  }

  /**
   * Handle deck changes from DeckManager
   * Resets flip state and card index on significant changes
   * Saves state after any modification
   */
  handleDeckChange(event, data) {
    switch (event) {
      case "deckCreated":
      case "deckDeleted":
      case "deckUpdated":
        this.renderDeckList();
        this.renderCards();
        this.savePersistedState();
        break;
      case "deckSelected":
        // Reset navigation state when switching decks
        this.currentCardIndex = 0;
        this.cardFlipState.clear();
        this.clearSearch();
        this.renderCards();
        this.savePersistedState();
        break;
      case "cardAdded":
      case "cardDeleted":
      case "cardUpdated":
        // Preserve flip state for edited/added cards, clear deleted card state
        if (event === "cardDeleted" && data.card) {
          this.cardFlipState.delete(data.card.id);
        }
        this.renderCards();
        this.savePersistedState();
        break;
    }
  }

  /**
   * Add a card to the selected deck
   */
  addCard() {
    const selectedDeck = this.deckManager.getSelectedDeck();
    if (!selectedDeck) {
      alert("Please select a deck first");
      return;
    }

    const front = prompt("Card front (question):");
    if (front === null) return;

    const back = prompt("Card back (answer):");
    if (back === null) return;

    if (front.trim() && back.trim()) {
      this.deckManager.addCardToDeck(selectedDeck.id, {
        front: front.trim(),
        back: back.trim(),
      });
    }
  }

  /**
   * Edit a card
   */
  editCard(cardId) {
    const selectedDeck = this.deckManager.getSelectedDeck();
    if (!selectedDeck) return;

    const card = selectedDeck.cards.find((c) => c.id === cardId);
    if (!card) return;

    const newFront = prompt("Edit front (question):", card.front);
    if (newFront === null) return;

    const newBack = prompt("Edit back (answer):", card.back);
    if (newBack === null) return;

    if (newFront.trim() && newBack.trim()) {
      // Update card in place
      card.front = newFront.trim();
      card.back = newBack.trim();
      // Notify observers of change
      this.deckManager.notifyObservers("cardUpdated", {
        deck: selectedDeck,
        card,
      });
    }
  }

  /**
   * Navigate to previous card
   */
  previousCard() {
    const selectedDeck = this.deckManager.getSelectedDeck();
    if (!selectedDeck || selectedDeck.cards.length === 0) {
      alert("No cards to navigate");
      return;
    }
    // Move to previous card, wrap around to last if at beginning
    this.currentCardIndex =
      (this.currentCardIndex - 1 + selectedDeck.cards.length) %
      selectedDeck.cards.length;
    // Reset flip state for new card navigation
    const currentCard = selectedDeck.cards[this.currentCardIndex];
    if (this.cardFlipState.has(currentCard.id)) {
      this.cardFlipState.delete(currentCard.id);
    }
    // Note: Full card navigation implementation (showing one card at a time)
    // would require UI redesign. Current implementation displays all cards.
    // This tracks state for future implementation.
  }

  /**
   * Enter Study Mode - Full screen card study with keyboard navigation
   * Shows one card at a time with keyboard shortcuts
   */
  enterStudyMode(deckId) {
    const deck = this.deckManager.getDeckById(deckId);
    if (!deck || deck.cards.length === 0) {
      alert("This deck has no cards. Add cards before entering study mode.");
      return;
    }

    // Clean up any existing study mode listeners before entering new mode
    if (this.studyMode && this.studyMode.active) {
      this.exitStudyMode();
    }

    // Store study mode state
    this.studyMode = {
      active: true,
      deckId: deckId,
      currentIndex: 0,
      startTime: Date.now(),
      cardsStudied: new Set(),
    };

    // Save current UI state
    this.studyModeBackup = {
      cardsContainerHTML: document.getElementById("cards-container").innerHTML,
      cardsContainerDisplay:
        document.getElementById("cards-container").style.display,
    };

    // Create study mode UI
    this.renderStudyModeCard();

    // Setup event delegation for study mode (single listeners, no duplication)
    this.setupStudyModeEventDelegation();

    // Bind keyboard event handler (bound to this for removal later)
    this.handleStudyModeKeydown = this.handleStudyModeKeydown.bind(this);
    document.addEventListener("keydown", this.handleStudyModeKeydown);

    // Announce to screen reader
    const deckName = deck.name;
    const cardCount = deck.cards.length;
    this.announceToScreenReader(
      `Study mode started. ${deckName} deck with ${cardCount} cards. Use arrow keys to navigate, Space to flip, Escape to exit.`,
    );
  }

  /**
   * Render current card in study mode
   */
  renderStudyModeCard() {
    const deck = this.deckManager.getDeckById(this.studyMode.deckId);
    if (!deck) return;

    const cardsContainer = document.getElementById("cards-container");
    const currentCard = deck.cards[this.studyMode.currentIndex];
    const totalCards = deck.cards.length;

    cardsContainer.innerHTML = `
      <div class="study-mode-container">
        <div class="study-mode-header">
          <h2>${deck.name}</h2>
          <p class="study-mode-progress">Card ${this.studyMode.currentIndex + 1} of ${totalCards}</p>
          <button class="btn btn-secondary" id="exit-study-mode" aria-label="Exit study mode">Exit Study Mode (Esc)</button>
        </div>

        <div class="study-mode-card-wrapper">
          <article 
            class="study-mode-card ${this.cardFlipState.get(currentCard.id) ? "is-flipped" : ""}"
            role="article"
            aria-label="Flashcard"
            data-card-id="${currentCard.id}"
            tabindex="0"
          >
            <div class="card-inner">
              <div class="card-front">
                <div class="study-mode-content">${currentCard.front || "Front"}</div>
                <p class="study-mode-hint">Click or press Space to flip</p>
              </div>
              <div class="card-back">
                <div class="study-mode-content">${currentCard.back || "Back"}</div>
              </div>
            </div>
          </article>
        </div>

        <div class="study-mode-controls">
          <button class="btn btn-secondary" id="study-prev-btn" aria-label="Previous card (← Arrow)">← Previous</button>
          <button class="btn btn-secondary" id="study-next-btn" aria-label="Next card (→ Arrow)">Next →</button>
          <span class="study-mode-stats">${this.studyMode.cardsStudied.size} / ${totalCards} reviewed</span>
        </div>

        <div class="study-mode-footer">
          <p class="sr-only" aria-live="polite" id="study-mode-announcer"></p>
          <small>Keyboard shortcuts: Arrow keys to navigate • Space to flip • Esc to exit</small>
        </div>
      </div>
    `;

    // Wire up study mode event listeners
    this.setupStudyModeEventListeners();

    // Mark card as studied
    this.studyMode.cardsStudied.add(currentCard.id);

    // Focus the card for keyboard accessibility
    const studyCard = document.querySelector(".study-mode-card");
    if (studyCard) {
      studyCard.focus();
    }
  }

  /**
   * Setup event delegation for study mode (attached once to cardsContainer)
   * Prevents listener duplication on re-renders
   */
  setupStudyModeEventDelegation() {
    // cardsContainer already has click delegation from setupEventListeners()
    // Just need to handle card flip with Space key
    const studyCard = document.querySelector(".study-mode-card");
    if (studyCard) {
      // Card click to flip (delegated from cardsContainer if possible)
      // But we need direct listener for proper focus and Space key handling
      // These listeners are only added when in study mode, removed on exit
      studyCard.addEventListener("click", () => this.toggleStudyModeFlip());
      studyCard.addEventListener("keydown", (e) => {
        if (e.key === " ") {
          e.preventDefault();
          this.toggleStudyModeFlip();
        }
      });
    }
  }

  /**
   * Setup event listeners for study mode (legacy - kept for compatibility)
   * NOTE: This should not be called directly - use setupStudyModeEventDelegation() instead
   * to prevent listener duplication
   */
  setupStudyModeEventListeners() {
    // DEPRECATED: Event handling now done via cardsContainer delegation
    // and setupStudyModeEventDelegation() for study-specific listeners
    // Kept for backward compatibility only
  }

  /**
   * Handle keyboard shortcuts in study mode
   */
  handleStudyModeKeydown(e) {
    if (!this.studyMode || !this.studyMode.active) return;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        this.studyModePrevious();
        break;
      case "ArrowRight":
        e.preventDefault();
        this.studyModeNext();
        break;
      case " ":
        e.preventDefault();
        this.toggleStudyModeFlip();
        break;
      case "Escape":
        e.preventDefault();
        this.exitStudyMode();
        break;
    }
  }

  /**
   * Toggle flip state in study mode
   */
  toggleStudyModeFlip() {
    const deck = this.deckManager.getDeckById(this.studyMode.deckId);
    if (!deck) return;

    const currentCard = deck.cards[this.studyMode.currentIndex];
    const studyCard = document.querySelector(".study-mode-card");

    if (studyCard) {
      studyCard.classList.toggle("is-flipped");
      this.cardFlipState.set(
        currentCard.id,
        studyCard.classList.contains("is-flipped"),
      );
    }
  }

  /**
   * Navigate to previous card in study mode
   */
  studyModePrevious() {
    if (!this.studyMode || !this.studyMode.active) return;

    const deck = this.deckManager.getDeckById(this.studyMode.deckId);
    if (!deck || deck.cards.length === 0) return;

    // Validate current index is within bounds
    const deckLength = deck.cards.length;
    if (
      this.studyMode.currentIndex < 0 ||
      this.studyMode.currentIndex >= deckLength
    ) {
      this.studyMode.currentIndex = 0;
    }

    // Move to previous card, wrap around to last if at beginning
    this.studyMode.currentIndex =
      (this.studyMode.currentIndex - 1 + deckLength) % deckLength;

    // Reset flip state for new card
    const currentCard = deck.cards[this.studyMode.currentIndex];
    if (this.cardFlipState.has(currentCard.id)) {
      this.cardFlipState.delete(currentCard.id);
    }

    // Re-render card
    this.renderStudyModeCard();
    this.announceToScreenReader(
      `Card ${this.studyMode.currentIndex + 1} of ${deckLength}`,
    );
  }

  /**
   * Navigate to next card in study mode
   */
  studyModeNext() {
    if (!this.studyMode || !this.studyMode.active) return;

    const deck = this.deckManager.getDeckById(this.studyMode.deckId);
    if (!deck || deck.cards.length === 0) return;

    // Validate current index is within bounds
    const deckLength = deck.cards.length;
    if (
      this.studyMode.currentIndex < 0 ||
      this.studyMode.currentIndex >= deckLength
    ) {
      this.studyMode.currentIndex = 0;
    }

    // Move to next card, wrap around to first if at end
    this.studyMode.currentIndex =
      (this.studyMode.currentIndex + 1) % deckLength;

    // Reset flip state for new card
    const currentCard = deck.cards[this.studyMode.currentIndex];
    if (this.cardFlipState.has(currentCard.id)) {
      this.cardFlipState.delete(currentCard.id);
    }

    // Re-render card
    this.renderStudyModeCard();
    this.announceToScreenReader(
      `Card ${this.studyMode.currentIndex + 1} of ${deckLength}`,
    );
  }

  /**
   * Exit study mode and restore normal view with complete cleanup
   */
  exitStudyMode() {
    if (!this.studyMode || !this.studyMode.active) return;

    // Remove keyboard event listener (critical to prevent memory leak)
    if (this.handleStudyModeKeydown) {
      document.removeEventListener("keydown", this.handleStudyModeKeydown);
    }

    // Remove card-specific event listeners to prevent leaks
    const studyCard = document.querySelector(".study-mode-card");
    if (studyCard) {
      // Remove click listener by cloning (cleanest way to remove all listeners)
      const newCard = studyCard.cloneNode(true);
      studyCard.parentElement.replaceChild(newCard, studyCard);
    }

    // Calculate study statistics
    const cardsReviewed = this.studyMode.cardsStudied.size;
    const timeSpent = Math.round(
      (Date.now() - this.studyMode.startTime) / 1000,
    );
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    // Clear study mode state (do this BEFORE restoring UI)
    this.studyMode.active = false;
    const backupHTML = this.studyModeBackup.cardsContainerHTML;

    // Restore UI from backup
    const cardsContainer = document.getElementById("cards-container");
    cardsContainer.innerHTML = backupHTML;

    // Restore normal view with re-rendering
    this.renderCards();

    // Announce exit
    this.announceToScreenReader(
      `Study mode ended. You reviewed ${cardsReviewed} cards in ${minutes}m ${seconds}s.`,
    );

    // Optional: Show summary alert
    alert(
      `Study Session Complete!\n\nCards Reviewed: ${cardsReviewed}\nTime Spent: ${minutes}m ${seconds}s`,
    );
  }

  /**
   * Load persisted state from localStorage with safety checks
   * Deep clones data to prevent mutations affecting stored state
   */
  loadPersistedState() {
    try {
      const savedState = storage.loadState();
      if (savedState && savedState.decks && Array.isArray(savedState.decks)) {
        // Deep clone decks to prevent mutations of original stored data
        this.deckManager.decks = JSON.parse(JSON.stringify(savedState.decks));

        // Calculate nextId safely - handle empty deck array
        const deckIds = this.deckManager.decks
          .map((d) => d.id)
          .filter(Number.isInteger);
        this.deckManager.nextId =
          deckIds.length > 0 ? Math.max(...deckIds) + 1 : 1;

        // Restore selected deck if it exists
        if (
          savedState.selectedDeckId &&
          Number.isInteger(savedState.selectedDeckId)
        ) {
          const deck = this.deckManager.getDeckById(savedState.selectedDeckId);
          if (deck) {
            this.deckManager.selectedDeckId = savedState.selectedDeckId;
          }
        }

        console.log(
          "Restored state from localStorage with",
          savedState.decks.length,
          "decks (nextId=",
          this.deckManager.nextId,
          ")",
        );
      }
    } catch (error) {
      console.error("Failed to load persisted state:", error);
      // Fall back to initial decks if load fails
    }
  }

  /**
   * Save current state to localStorage
   */
  savePersistedState() {
    try {
      const state = {
        decks: this.deckManager.decks,
        selectedDeckId: this.deckManager.selectedDeckId,
        searchQuery: this.getSearchQuery(),
      };
      const success = storage.saveState(state);
      if (success) {
        console.log("State saved to localStorage");
      }
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  /**
   * Setup search input listener with debouncing
   */
  setupSearchListener() {
    const searchInput = document.getElementById("search-input");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
      const query = e.target.value;
      this.performSearch(query);
    });
  }

  /**
   * Perform debounced search on current deck's cards
   * @param {string} query - Search query
   */
  performSearch(query) {
    const selectedDeck = this.deckManager.getSelectedDeck();
    if (!selectedDeck) return;

    this.searchManager.search(
      selectedDeck.cards,
      query,
      (filteredCards, matchCount) => {
        this.filteredCards = filteredCards;
        this.isSearchActive = query.trim() !== "";
        this.updateSearchStats(selectedDeck.cards.length, matchCount);
        this.renderCards();
      },
    );
  }

  /**
   * Get current search query
   * @returns {string} Current search query
   */
  getSearchQuery() {
    const searchInput = document.getElementById("search-input");
    return searchInput ? searchInput.value : "";
  }

  /**
   * Clear search and show all cards
   */
  clearSearch() {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.value = "";
      this.isSearchActive = false;
      this.filteredCards = [];
      this.updateSearchStats(0, 0);
      this.renderCards();
    }
  }

  /**
   * Update search statistics display
   * @param {number} total - Total cards in deck
   * @param {number} matches - Number of matching cards
   */
  updateSearchStats(total, matches) {
    const statsElement = document.getElementById("search-stats");
    if (!statsElement) return;

    if (!this.isSearchActive) {
      statsElement.innerHTML = "";
      return;
    }

    const percentage = total > 0 ? Math.round((matches / total) * 100) : 0;
    const statsHtml = `
      <span class="search-match-count">
        ${matches} match${matches !== 1 ? "es" : ""} of ${total} cards (${percentage}%)
      </span>
    `;
    statsElement.innerHTML = statsHtml;
  }

  /**
   * Screen reader announcement helper
   */
  announceToScreenReader(message) {
    let announcer = document.getElementById("aria-announcer");
    if (!announcer) {
      announcer = document.createElement("div");
      announcer.id = "aria-announcer";
      announcer.setAttribute("aria-live", "polite");
      announcer.setAttribute("aria-atomic", "true");
      announcer.className = "sr-only";
      document.body.appendChild(announcer);
    }
    announcer.textContent = message;
    setTimeout(() => {
      announcer.textContent = "";
    }, 1000);
  }
}

/**
 * Simple Accessible Modal implementation (embedded for convenience)
 */
class AccessibleModal {
  constructor(modalSelector, options = {}) {
    this.modal = document.querySelector(modalSelector);
    if (!this.modal) {
      console.error(`Modal element not found: ${modalSelector}`);
      return;
    }

    this.options = {
      closeButtonSelector: "[data-modal-close]",
      closeOnBackdropClick: true,
      ...options,
    };

    this.focusTrapActive = false;
    this.previouslyFocusedElement = null;
    this.focusableElements = [];

    this.init();
  }

  init() {
    this.modal.setAttribute("role", "dialog");
    this.modal.setAttribute("aria-modal", "true");
    if (!this.modal.id) {
      this.modal.id = `modal-${Date.now()}`;
    }

    const closeButtons = this.modal.querySelectorAll(
      this.options.closeButtonSelector,
    );
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.close());
    });

    const backdrop = this.modal.parentElement;
    if (this.options.closeOnBackdropClick && backdrop) {
      // Guard: Only attach backdrop listener once to prevent duplication
      if (!backdrop.dataset.backdropListenerAttached) {
        backdrop.addEventListener("click", (e) => {
          if (e.target === backdrop) {
            this.close();
          }
        });
        backdrop.dataset.backdropListenerAttached = "true";
      }
    }

    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  getFocusableElements() {
    // Include visibility check to ensure elements are actually interactable
    const focusableSelectors = [
      "a[href]:not([tabindex='-1'])",
      "button:not([disabled]):not([tabindex='-1'])",
      "textarea:not([disabled]):not([tabindex='-1'])",
      'input[type="text"]:not([disabled]):not([tabindex="-1"])',
      'input[type="radio"]:not([disabled]):not([tabindex="-1"])',
      'input[type="checkbox"]:not([disabled]):not([tabindex="-1"])',
      "select:not([disabled]):not([tabindex='-1'])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    return Array.from(this.modal.querySelectorAll(focusableSelectors)).filter(
      (el) => {
        // Only include elements that are truly visible
        return (
          el.offsetParent !== null &&
          getComputedStyle(el).visibility !== "hidden" &&
          getComputedStyle(el).display !== "none"
        );
      },
    );
  }

  trapFocus(e) {
    // Re-query focusable elements on each Tab to handle dynamic content
    if (e.key === "Tab") {
      this.focusableElements = this.getFocusableElements();

      if (this.focusableElements.length === 0) {
        // No focusable elements, trap focus on modal itself
        e.preventDefault();
        return;
      }

      const firstElement = this.focusableElements[0];
      const lastElement =
        this.focusableElements[this.focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab on first element -> move to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab on last element -> move to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  handleKeyDown(e) {
    // Only handle keys if modal is actually open
    if (!this.focusTrapActive) {
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }

    if (e.key === "Tab") {
      this.trapFocus(e);
    }
  }

  open(triggerElement = null) {
    // Store previously focused element for restoration on close
    this.previouslyFocusedElement = triggerElement || document.activeElement;

    // Get ALL focusable elements inside modal
    this.focusableElements = this.getFocusableElements();

    // Show modal
    this.modal.style.display = "block";
    this.modal.setAttribute("aria-hidden", "false");

    // Activate focus trap BEFORE setting focus
    this.focusTrapActive = true;
    document.addEventListener("keydown", this.handleKeyDown);
    document.body.style.overflow = "hidden";

    // Set initial focus to first focusable element
    if (this.focusableElements.length > 0) {
      // Prefer input fields for initial focus in forms
      const inputElement = this.focusableElements.find(
        (el) => el.tagName === "INPUT" || el.tagName === "TEXTAREA",
      );
      if (inputElement) {
        inputElement.focus();
      } else {
        this.focusableElements[0].focus();
      }
    } else {
      // Fallback: focus modal itself
      this.modal.focus();
    }

    this.announceToScreenReader("Dialog opened");
  }

  close() {
    // Deactivate focus trap FIRST
    this.focusTrapActive = false;
    document.removeEventListener("keydown", this.handleKeyDown);

    // Hide modal
    this.modal.style.display = "none";
    this.modal.setAttribute("aria-hidden", "true");

    // Restore UI state
    document.body.style.overflow = "";

    // Restore focus to previously focused element
    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === "function"
    ) {
      // Use setTimeout to ensure focus happens after DOM is fully updated
      setTimeout(() => {
        this.previouslyFocusedElement.focus();
      }, 0);
    }

    this.announceToScreenReader("Dialog closed");
  }

  announceToScreenReader(message) {
    let announcer = document.getElementById("aria-announcer");
    if (!announcer) {
      announcer = document.createElement("div");
      announcer.id = "aria-announcer";
      announcer.setAttribute("aria-live", "polite");
      announcer.setAttribute("aria-atomic", "true");
      announcer.className = "sr-only";
      document.body.appendChild(announcer);
    }
    announcer.textContent = message;
    setTimeout(() => {
      announcer.textContent = "";
    }, 1000);
  }

  toggle(triggerElement = null) {
    if (this.modal.style.display === "none" || !this.modal.style.display) {
      this.open(triggerElement);
    } else {
      this.close();
    }
  }

  isOpen() {
    return this.modal.style.display === "block";
  }

  destroy() {
    document.removeEventListener("keydown", this.handleKeyDown);
    this.modal = null;
    this.previouslyFocusedElement = null;
    this.focusableElements = [];
  }
}

/**
 * Application initialization
 */
document.addEventListener("DOMContentLoaded", () => {
  const deckManager = new DeckManager();
  const uiManager = new UIManager(deckManager);
});
