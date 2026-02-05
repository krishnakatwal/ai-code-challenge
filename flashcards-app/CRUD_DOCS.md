# Flashcards App - Deck CRUD System Documentation

## Architecture Overview

The app implements a three-layer architecture:

1. **DeckManager** - Business logic layer (in-memory data storage)
2. **UIManager** - UI coordination layer (handles DOM updates)
3. **AccessibleModal** - Modal dialog component (handles accessibility)

## Data Model

### Deck Object

```javascript
{
  id: number,           // Unique identifier
  name: string,         // Deck name
  cards: Array,         // Array of card objects
  createdAt: Date       // Creation timestamp
}
```

### Card Object

```javascript
{
  id: string,           // Format: "deckId-cardIndex"
  front: string,        // Question/prompt
  back: string,         // Answer
  createdAt: Date       // Creation timestamp
}
```

## DeckManager API

### Constructor

```javascript
const deckManager = new DeckManager();
```

Automatically loads 3 sample decks on initialization.

### Core Methods

#### `getAllDecks()`

Returns a shallow copy of all decks.

```javascript
const allDecks = deckManager.getAllDecks();
```

#### `getDeckById(id)`

Retrieves a specific deck by ID.

```javascript
const deck = deckManager.getDeckById(1);
```

#### `createDeck(name)`

Creates a new deck with the given name.

- **Validates** deck name is not empty
- **Throws** error if validation fails
- **Notifies** observers of creation
- **Returns** the created deck object

```javascript
try {
  const newDeck = deckManager.createDeck("Spanish Vocabulary");
  console.log(`Created deck with ID: ${newDeck.id}`);
} catch (error) {
  console.error("Failed to create deck:", error.message);
}
```

#### `updateDeck(id, updates)`

Updates an existing deck.

- **Parameters**: `id` (number), `updates` (object with `name` property)
- **Throws** error if deck not found or name is invalid
- **Notifies** observers of update
- **Returns** updated deck

```javascript
try {
  deckManager.updateDeck(1, { name: "Updated Name" });
} catch (error) {
  console.error("Update failed:", error.message);
}
```

#### `deleteDeck(id)`

Deletes a deck by ID.

- **Clears** selection if deleted deck was active
- **Throws** error if deck not found
- **Notifies** observers of deletion
- **Returns** deleted deck

```javascript
try {
  deckManager.deleteDeck(1);
} catch (error) {
  console.error("Delete failed:", error.message);
}
```

#### `selectDeck(id)`

Sets the active/selected deck.

- **Throws** error if deck doesn't exist
- **Notifies** observers of selection
- **Returns** selected deck

```javascript
deckManager.selectDeck(1);
const selectedDeck = deckManager.getSelectedDeck();
```

#### `getSelectedDeck()`

Returns the currently selected deck or null.

```javascript
const activeDeck = deckManager.getSelectedDeck();
if (activeDeck) {
  console.log(`Currently viewing: ${activeDeck.name}`);
}
```

### Card Methods

#### `addCardToDeck(deckId, cardData)`

Adds a card to a specific deck.

- **Parameters**: `deckId` (number), `cardData` ({ front: string, back: string })
- **Throws** error if deck not found
- **Notifies** observers of card addition
- **Returns** created card

```javascript
try {
  const card = deckManager.addCardToDeck(1, {
    front: "What is the capital of Spain?",
    back: "Madrid",
  });
} catch (error) {
  console.error("Failed to add card:", error.message);
}
```

#### `deleteCardFromDeck(deckId, cardId)`

Removes a card from a deck.

- **Parameters**: `deckId` (number), `cardId` (string)
- **Throws** error if deck or card not found
- **Notifies** observers of card deletion
- **Returns** deleted card

```javascript
try {
  deckManager.deleteCardFromDeck(1, "1-1");
} catch (error) {
  console.error("Failed to delete card:", error.message);
}
```

### Observer Pattern

#### `subscribe(callback)`

Register a callback to observe deck changes.

```javascript
deckManager.subscribe((event, data) => {
  console.log(`Event: ${event}`, data);
});
```

**Events emitted:**

- `deckCreated` - New deck created (data: deck object)
- `deckUpdated` - Deck properties changed (data: deck object)
- `deckDeleted` - Deck removed (data: deck object)
- `deckSelected` - Deck selected (data: deck object)
- `cardAdded` - Card added to deck (data: { deck, card })
- `cardDeleted` - Card removed from deck (data: { deck, card })

#### `unsubscribe(callback)`

Remove a callback from observers.

```javascript
deckManager.unsubscribe(myCallback);
```

## UIManager API

### Constructor

```javascript
const uiManager = new UIManager(deckManager);
```

Automatically:

- Initializes the modal component
- Subscribes to deck manager updates
- Sets up event listeners
- Renders initial deck list

### Methods

#### `renderDeckList()`

Renders all decks in the sidebar with delete buttons.

- Updates deck selection UI
- Adds event listeners to buttons
- Regenerated on any deck change

#### `selectDeck(deckId)`

Selects a deck and updates UI.

- Updates selected deck in manager
- Re-renders deck list (highlighting selection)
- Re-renders cards for selected deck

#### `renderCards()`

Renders cards for the selected deck.

- Shows message if no deck selected
- Shows message if deck has no cards
- Creates card elements with front/back content

#### `addCard()`

Prompts user for card content and adds to selected deck.

- Validates front/back are not empty
- Updates UI automatically via observer

#### `previousCard()` / `nextCard()`

Placeholder methods for card navigation (future implementation).

### Event Handling

The UIManager automatically handles:

- **Add Deck Button Click** - Opens modal for new deck creation
- **Create Deck Confirmation** - Validates input, creates deck, updates UI
- **Deck Selection** - Updates selection state and renders cards
- **Deck Deletion** - With confirmation dialog
- **Card Controls** - Previous/Next/Add card buttons

## Usage Example

### Basic Setup

```javascript
// Create deck manager with in-memory storage
const deckManager = new DeckManager();

// Create UI manager (automatically wires everything)
const uiManager = new UIManager(deckManager);

// Done! The app is now fully functional
```

### Direct API Usage

```javascript
// Create a deck
const newDeck = deckManager.createDeck("French Phrases");

// Select it
deckManager.selectDeck(newDeck.id);

// Add some cards
deckManager.addCardToDeck(newDeck.id, {
  front: "Hello",
  back: "Bonjour",
});

deckManager.addCardToDeck(newDeck.id, {
  front: "Goodbye",
  back: "Au revoir",
});

// Get the updated deck
const deck = deckManager.getSelectedDeck();
console.log(`${deck.name} has ${deck.cards.length} cards`);
```

### Observer Pattern Usage

```javascript
deckManager.subscribe((event, data) => {
  switch (event) {
    case "deckCreated":
      console.log(`New deck created: ${data.name}`);
      break;
    case "cardAdded":
      console.log(`Card added to ${data.deck.name}`);
      break;
    case "deckDeleted":
      console.log(`Deck deleted: ${data.name}`);
      break;
  }
});
```

## State Management

### Current State

- **In-memory array** of deck objects
- **selectedDeckId** - ID of currently selected deck
- **nextId** - Counter for generating unique deck IDs

### State Flow

```
User Action
    ↓
DeckManager CRUD Method
    ↓
Validate & Update State
    ↓
Notify Observers
    ↓
UIManager Updates DOM
    ↓
User Sees Changes
```

## Future Enhancements

### Planned Features

1. **LocalStorage Persistence** - Save decks between sessions
2. **Card Editing** - Modify existing card content
3. **Card Navigation** - Implement Previous/Next card cycling
4. **Search/Filter** - Find decks by name
5. **Deck Statistics** - Show card count, completion rate
6. **Categories** - Organize decks into groups
7. **Import/Export** - Save/load deck data

### Implementation Path

1. Add localStorage sync to DeckManager
2. Extend UIManager with edit modal
3. Add card state manager for navigation
4. Add search input to sidebar
5. Create stats display component

## Error Handling

All CRUD operations include validation:

```javascript
// Deck name validation
if (!name || name.trim() === "") {
  throw new Error("Deck name cannot be empty");
}

// Deck lookup validation
if (!deck) {
  throw new Error(`Deck with ID ${id} not found`);
}

// Consistent error handling pattern
try {
  deckManager.createDeck(name);
} catch (error) {
  console.error("Operation failed:", error.message);
  // Handle error in UI
}
```

## Performance Considerations

- **Shallow copies** used for getAllDecks() to prevent external mutations
- **Array methods** (find, splice) are efficient for small collections
- **Shallow re-rendering** updates only affected DOM nodes
- **Event delegation** reduces event listener count (single listener per container, not per element)
- **O(n) operations** acceptable for typical deck counts (<100 decks)
- **No duplicate listeners** - handlers bound once on parent containers via `closest()` method, not on individual dynamic elements

## Event Delegation Pattern

The UIManager uses event delegation to prevent listener duplication:

```javascript
// Single listener on container handles all deck operations
decksList.addEventListener("click", (e) => {
  const deckButton = e.target.closest(".deck-button");
  const deleteButton = e.target.closest(".deck-delete-btn");

  if (deckButton) {
    // Handle deck selection
  } else if (deleteButton) {
    // Handle deck deletion
  }
});
```

**Benefits:**

- ✅ No listener memory leaks from re-renders
- ✅ Single event listener per container, not per element
- ✅ Works with dynamically added/removed elements
- ✅ Improved performance with large deck lists
- ✅ Cleaner code with centralized event handling

## Accessibility Features

### Modal Focus Trap Implementation

The `AccessibleModal` class provides keyboard-only accessible dialogs:

**Focus Trap Mechanism:**

```javascript
// 1. Retrieves all focusable elements inside modal
this.focusableElements = this.getFocusableElements();

// 2. Prevents focus from leaving modal when Tab/Shift+Tab pressed
trapFocus(e) {
  if (e.key === "Tab") {
    // On Tab: if at last element, move to first
    // On Shift+Tab: if at first element, move to last
  }
}

// 3. Handles ESC key to close modal
handleKeyDown(e) {
  if (e.key === "Escape") {
    this.close();
  }
}
```

**Key Improvements in v2:**

- ✅ **Visibility filtering**: Only includes visible, non-disabled elements in focus trap
- ✅ **Dynamic element detection**: Re-queries focusable elements on each Tab to handle updated DOM
- ✅ **Input prioritization**: Sets initial focus to form inputs instead of buttons
- ✅ **Ordered focus**: Maintains logical tab order through modal elements
- ✅ **Edge case handling**: Gracefully handles modals with 0 or 1 focusable element
- ✅ **Trap state verification**: Only traps focus when `focusTrapActive` is true
- ✅ **Proper cleanup**: Removes keydown listener when modal closes

**Focus Restoration:**

```javascript
// When modal opens
this.previouslyFocusedElement = triggerElement || document.activeElement;

// When modal closes
setTimeout(() => {
  this.previouslyFocusedElement.focus();
}, 0);
```

Uses `setTimeout` to ensure focus restoration happens after DOM updates complete.

### ARIA Attributes

Modal includes comprehensive ARIA:

```html
<div
  class="modal"
  id="deckModal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="deckModalTitle"
  aria-hidden="false"
>
  <h2 id="deckModalTitle">Create New Deck</h2>
  <input aria-describedby="deckNameHint" />
  <p id="deckNameHint" class="sr-only">
    Enter a name for your new flashcard deck
  </p>
</div>
```

- `role="dialog"` - Identifies as modal dialog
- `aria-modal="true"` - Signals to screen readers that background is inert
- `aria-labelledby="deckModalTitle"` - Links heading to modal for labeling
- `aria-describedby` - Provides additional context for form fields
- `aria-hidden` - Dynamically toggles visibility to screen readers

### Screen Reader Announcements

Modal announces state changes:

```javascript
this.announceToScreenReader("Dialog opened");
this.announceToScreenReader("Dialog closed");
```

Uses ARIA live region (`aria-live="polite"`) to notify screen reader users of modal state changes.

### Keyboard Shortcuts

| Key       | Action                       | Availability              |
| --------- | ---------------------------- | ------------------------- |
| Enter     | Submit deck (in input field) | When focus in input field |
| Tab       | Next focusable element       | Always (in modal)         |
| Shift+Tab | Previous focusable element   | Always (in modal)         |
| Escape    | Close modal                  | When modal is open        |

- [ ] Create new deck with valid name
- [ ] Create new deck with empty name (should error)
- [ ] Select different decks (highlights correct button)
- [ ] Delete deck (confirms before deletion)
- [ ] Add card to deck (appears in list)
- [ ] Modal opens with correct focus
- [ ] ESC key closes modal
- [ ] Focus returns to add button after close
- [ ] Deck list updates after all operations
- [ ] **No console errors when deleting/creating decks multiple times**
- [ ] **Click deck buttons rapidly - no duplicate handlers**

### Keyboard-Only Focus Trap Testing

**Test with keyboard navigation ONLY (no mouse):**

1. **Tab Through Modal**
   - Click "Add Deck" button (or Tab+Enter to activate it)
   - Press Tab repeatedly - focus should cycle through: Input → Cancel → Create → back to Input
   - Verify Shift+Tab cycles in reverse: Create → Cancel → Input → back to Create
   - Expected: Focus never leaves modal, always cycles within modal elements

2. **Tab Trap Boundaries**
   - Modal with 3 focusable elements (input, cancel, create)
   - Press Tab from Create button → Should move to Input (wraps around)
   - Press Shift+Tab from Input → Should move to Create (wraps backward)
   - No focus should reach elements outside modal

3. **Initial Focus Placement**
   - When modal opens, focus should automatically move to the input field
   - This allows immediate typing without clicking
   - Verify by: Open modal, type deck name without clicking input

4. **ESC Key Handling**
   - Focus is anywhere in modal
   - Press ESC key
   - Modal should close and focus should return to "Add Deck" button
   - Verify button is visually focused (outline visible)

5. **Visibility Check**
   - Ensure getFocusableElements() only returns visible, enabled elements
   - Hidden/disabled elements should NOT participate in focus trap
   - Test by inspecting: Modal focus trap should adapt if elements are hidden

6. **Edge Case: No Focusable Elements**
   - If modal somehow has no focusable elements, Tab should be harmless
   - Should NOT throw errors
   - Focus should remain on modal container (with tabindex="0" or role="dialog")

### Browser DevTools Event Listener Audit

To verify no duplicate listeners:

1. Open browser DevTools (F12)
2. Select the modal element (#deckModal)
3. In Console, run: `getEventListeners(document).keydown`
4. Should show exactly **one** keydown listener during modal open
5. Close modal - listener should be removed
6. Re-open modal - listener should be re-added (not duplicated)

### Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE 11: ⚠️ Requires polyfills

## Code Organization

```
app.js
├── DeckManager (business logic)
├── UIManager (UI coordination)
├── AccessibleModal (modal component)
└── DOMContentLoaded initialization
```

All classes are self-contained and could be separated into modules for larger projects.
