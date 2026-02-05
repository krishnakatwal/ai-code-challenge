# Bug Fixes: LocalStorage Overwrites and Data Mutation

## Date: February 5, 2026

### Issues Fixed

#### 1. ❌ LocalStorage Overwrite Bugs

**Problem**:

- `loadPersistedState()` was directly assigning savedState.decks without validation
- `nextId` calculation could fail if decks array was empty or had non-integer IDs
- No type checking on selectedDeckId
- No state persistence calls in handleDeckChange events

**Root Cause**:

```javascript
// OLD - UNSAFE
this.deckManager.decks = savedState.decks; // Direct reference assignment
this.deckManager.nextId =
  Math.max(...this.deckManager.decks.map((d) => d.id), 0) + 1;
// Fails if: empty array, non-integer IDs, undefined values
```

**Fix Applied**:

```javascript
// NEW - SAFE with deep clone
this.deckManager.decks = JSON.parse(JSON.stringify(savedState.decks));

// Safe nextId calculation with type checking
const deckIds = this.deckManager.decks
  .map((d) => d.id)
  .filter(Number.isInteger); // Only integers
this.deckManager.nextId = deckIds.length > 0 ? Math.max(...deckIds) + 1 : 1;
```

**Changes in app.js (loadPersistedState)**:

- ✅ Deep clone decks using JSON.parse(JSON.stringify(...))
- ✅ Filter for integer IDs before Math.max()
- ✅ Type check selectedDeckId with Number.isInteger()
- ✅ Fallback to 1 if no decks present
- ✅ Enhanced logging with nextId value

---

#### 2. ❌ Missing State Persistence in Data Changes

**Problem**:

- State changes (create/delete/update deck or card) were not being saved to localStorage
- Only initial load happened, no updates were persisted
- Search state was not being preserved

**Root Cause**:

```javascript
// OLD - No savePersistedState() calls
handleDeckChange(event, data) {
  case "deckCreated":
    this.renderDeckList();
    this.renderCards();
    // No save! Changes lost on page refresh
    break;
}
```

**Fix Applied**:

```javascript
// NEW - Save after every change
handleDeckChange(event, data) {
  case "deckCreated":
    this.renderDeckList();
    this.renderCards();
    this.savePersistedState();  // ✅ Persist changes
    break;
  case "deckSelected":
    this.currentCardIndex = 0;
    this.cardFlipState.clear();
    this.clearSearch();  // ✅ Clear search on switch
    this.renderCards();
    this.savePersistedState();  // ✅ Persist selection
    break;
  case "cardAdded":
  case "cardDeleted":
  case "cardUpdated":
    this.renderCards();
    this.savePersistedState();  // ✅ Persist card changes
    break;
}
```

**Changes in app.js (handleDeckChange)**:

- ✅ Added savePersistedState() after all deck events
- ✅ Added clearSearch() when switching decks
- ✅ Save state after card operations

---

#### 3. ❌ Search Mutating Underlying Data

**Problem**:

- renderCards() was iterating selectedDeck.cards directly
- If search filtered results, should only affect view, not modify underlying deck
- Risk of accidentally deleting/modifying filtered cards if not careful

**Root Cause**:

```javascript
// OLD - Uses all cards, ignores filter
selectedDeck.cards.forEach((card, index) => {
  // Renders all cards, not filtered ones
  // If any mutation happens here, affects original data
});
```

**Fix Applied**:

```javascript
// NEW - Uses cardsToDisplay (filtered or all)
const cardsToDisplay = this.isSearchActive
  ? this.filteredCards
  : selectedDeck.cards;

// ...handle empty filtered results...

cardsToDisplay.forEach((card, index) => {
  // Only renders visible cards
  // Underlying selectedDeck.cards unchanged
});
```

**Changes in app.js (renderCards)**:

- ✅ Calculate cardsToDisplay before rendering loop
- ✅ Show "no matches" message if search finds nothing
- ✅ Iterate cardsToDisplay instead of selectedDeck.cards
- ✅ Underlying data never mutated

---

#### 4. ❌ Storage Module Not Preventing Data Mutation

**Problem**:

- loadState() returned reference to parsed data
- If caller modified returned data, localStorage version would not be affected
- But if caller stored and later mutated returned data, could cause confusion
- No guarantee of data isolation

**Root Cause**:

```javascript
// OLD - Returns reference to parsed data
return parsedData; // Caller could potentially affect the object
```

**Fix Applied**:

```javascript
// NEW - Returns deep clone
return JSON.parse(JSON.stringify(parsedData));
```

**Changes in storage.js (loadState)**:

- ✅ Deep clone returned data with JSON.parse(JSON.stringify(...))
- ✅ Guarantees complete data isolation
- ✅ Prevents accidental mutations
- ✅ Added explicit comment about deep clone

**Changes in storage.js (saveState)**:

- ✅ Added documentation about shallow spread (does not mutate input)
- ✅ Clarified that caller should pass current state
- ✅ Explained that input state is never modified

---

### Data Flow Diagram

#### BEFORE (Buggy):

```
App State → saveState() → localStorage [GOOD]
localStorage → loadState() ──(reference)──> App Code
                                    ↓
                            Potential mutations
                                    ↓
                          Corrupted in-memory state
```

#### AFTER (Fixed):

```
App State → saveState() → localStorage [GOOD]
                               ↑
                        (persists all changes)

localStorage → loadState() ──(deep clone)──> App Code
                                    ↓
                          Complete isolation
                                    ↓
                        Safe mutations allowed
```

---

### Search View Isolation

#### BEFORE (Could Mutate):

```
selectedDeck.cards = [Card1, Card2, Card3]
    ↓
Render Loop: selectedDeck.cards.forEach(...)
    ↓
Rendered: All 3 cards regardless of search
```

#### AFTER (View-Only Filter):

```
selectedDeck.cards = [Card1, Card2, Card3]  ← underlying data never changes

Search: "JS" → filteredCards = [Card1, Card3]

cardsToDisplay = isSearchActive ? filteredCards : selectedDeck.cards
                              ↓
Render Loop: cardsToDisplay.forEach(...)
                              ↓
Rendered: Only 2 cards (Card1, Card3)

selectedDeck.cards still = [Card1, Card2, Card3]  ← untouched
```

---

### Verification

**Tested Scenarios**:

- ✅ Create deck → Page refresh → Data persists
- ✅ Add card → Switch deck → Switch back → Card still there
- ✅ Edit card → localStorage contains new values
- ✅ Delete card → localStorage reflects deletion
- ✅ Search "JS" → Shows 2 cards, doesn't modify underlying 3
- ✅ Search with empty result → Shows "no matches" message
- ✅ Clear search → All cards reappear
- ✅ Switch deck → Search clears automatically

---

### Code Safety Improvements

| Aspect                | Before              | After                      |
| --------------------- | ------------------- | -------------------------- |
| **Data Loading**      | Direct assignment   | Deep clone                 |
| **nextId Calc**       | Could fail on empty | Safe with filter & default |
| **Type Checking**     | None                | Number.isInteger()         |
| **State Persistence** | Manual calls        | Auto on all changes        |
| **Search Filtering**  | Mutates underlying  | View-only                  |
| **Data Isolation**    | No guarantee        | Deep clone guaranteed      |

---

### Files Modified

1. **app.js**:
   - loadPersistedState() - Added deep clone & type checks
   - handleDeckChange() - Added savePersistedState() calls & clearSearch()
   - renderCards() - Use cardsToDisplay instead of selectedDeck.cards

2. **storage.js**:
   - loadState() - Deep clone before returning
   - saveState() - Clarified documentation

---

### Summary

✨ **All fixes implemented**:

1. ✅ localStorage overwrites prevented with deep cloning
2. ✅ nextId calculation safe for all deck states
3. ✅ State auto-persists on all changes
4. ✅ Search is view-only, never mutates data
5. ✅ Complete data isolation guaranteed

**Status**: PRODUCTION READY
