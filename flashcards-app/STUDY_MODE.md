# Study Mode Feature Documentation

## Overview

Study Mode provides an immersive, full-screen card review experience optimized for learning. Users enter a dedicated study interface with keyboard shortcuts, progress tracking, and session statistics.

## Feature Highlight

✅ **One-Card-At-A-Time Display** - Focus on individual cards without distraction
✅ **Keyboard Shortcuts** - Arrow keys for navigation, Space to flip, Esc to exit
✅ **Progress Tracking** - Shows current card number and cards reviewed count
✅ **Session Statistics** - Time spent and cards studied summary on exit
✅ **Flip State Preservation** - Flip states persist across navigation
✅ **Accessibility** - Full keyboard navigation, screen reader support, ARIA labels
✅ **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

---

## API Reference

### `enterStudyMode(deckId)`

Initiates study mode for a specified deck.

**Parameters:**

- `deckId` (number): The ID of the deck to study

**Returns:** void

**Usage:**

```javascript
const uiManager = new UIManager(deckManager);
const selectedDeck = deckManager.getSelectedDeck();
uiManager.enterStudyMode(selectedDeck.id);
```

**Validation:**

- Checks if deck exists
- Checks if deck has at least one card
- Shows alert if deck is empty

**Internal State Initialized:**

```javascript
this.studyMode = {
  active: true,
  deckId: deckId,
  currentIndex: 0,
  startTime: Date.now(),
  cardsStudied: new Set(),
};
```

---

## Keyboard Shortcuts

| Key                 | Action          | Description                                |
| ------------------- | --------------- | ------------------------------------------ |
| **←** (Left Arrow)  | Previous Card   | Navigate to previous card (wraps to last)  |
| **→** (Right Arrow) | Next Card       | Navigate to next card (wraps to first)     |
| **Space**           | Flip Card       | Toggle between front and back              |
| **Esc**             | Exit Study Mode | Return to normal view with session summary |

All keyboard shortcuts are announced to screen readers.

---

## User Interface

### Study Mode Container

```
┌─────────────────────────────────────────────┐
│ Study Mode Header                           │
│ ✓ Deck Name                                 │
│ ✓ Card X of Y progress indicator           │
│ ✓ Exit Study Mode button                    │
├─────────────────────────────────────────────┤
│                                             │
│       ┌──────────────────────────┐          │
│       │     Flashcard Front      │          │
│       │   (Click or Sp to flip)  │          │
│       └──────────────────────────┘          │
│                                             │
├─────────────────────────────────────────────┤
│ [← Previous] [Next →] [Cards reviewed: X/Y]│
├─────────────────────────────────────────────┤
│ Keyboard shortcuts: ← → to navigate ...     │
└─────────────────────────────────────────────┘
```

### CSS Classes

**Main Container:**

- `.study-mode-container` - Flex column layout with animations

**Header:**

- `.study-mode-header` - Centered header with deck info
- `.study-mode-progress` - "Card X of Y" text

**Card Display:**

- `.study-mode-card-wrapper` - Perspective container for 3D effect
- `.study-mode-card` - Individual card with flip animation
- `.study-mode-content` - Card text content area
- `.study-mode-hint` - "Click or press Space to flip" hint

**Controls:**

- `.study-mode-controls` - Navigation buttons and stats
- `.study-mode-stats` - Cards reviewed counter

**Footer:**

- `.study-mode-footer` - Keyboard shortcuts reference

---

## Internal Methods

### `renderStudyModeCard()`

Renders the current card in study mode with updated HTML structure.

**Responsibilities:**

- Clears cards container
- Creates study mode UI with header, card, controls, footer
- Restores flip state for current card
- Wires up event listeners for study mode interactions
- Marks card as studied in `this.studyMode.cardsStudied` Set
- Focuses the card for keyboard accessibility
- Announces card position to screen readers

**HTML Structure Created:**

```html
<div class="study-mode-container">
  <div class="study-mode-header">
    <h2>${deck.name}</h2>
    <p class="study-mode-progress">Card X of Y</p>
    <button id="exit-study-mode">Exit Study Mode (Esc)</button>
  </div>

  <div class="study-mode-card-wrapper">
    <article class="study-mode-card ${isFlipped ? 'is-flipped' : ''}">
      <div class="card-inner">
        <div class="card-front">...</div>
        <div class="card-back">...</div>
      </div>
    </article>
  </div>

  <div class="study-mode-controls">
    <button id="study-prev-btn">← Previous</button>
    <button id="study-next-btn">Next →</button>
    <span class="study-mode-stats">X / Y reviewed</span>
  </div>

  <div class="study-mode-footer">
    <small>Keyboard shortcuts...</small>
  </div>
</div>
```

---

### `setupStudyModeEventListeners()`

Wires up all event listeners for study mode interactions.

**Listeners Attached:**

1. Exit button click → `exitStudyMode()`
2. Previous button click → `studyModePrevious()`
3. Next button click → `studyModeNext()`
4. Card click → `toggleStudyModeFlip()`
5. Card Space key → `toggleStudyModeFlip()`

---

### `handleStudyModeKeydown(e)`

Global keyboard handler bound during study mode.

**Key Handling:**

- **ArrowLeft** → `studyModePrevious()`
- **ArrowRight** → `studyModeNext()`
- **Space** → `toggleStudyModeFlip()`
- **Escape** → `exitStudyMode()`

**Event Binding:**

```javascript
this.handleStudyModeKeydown = this.handleStudyModeKeydown.bind(this);
document.addEventListener("keydown", this.handleStudyModeKeydown);
```

**Cleanup on Exit:**

```javascript
document.removeEventListener("keydown", this.handleStudyModeKeydown);
```

---

### `toggleStudyModeFlip()`

Flips the current card and updates flip state Map.

**Actions:**

1. Toggles `.is-flipped` class on card element
2. Updates `this.cardFlipState` Map with new state
3. Preserves flip state for subsequent navigation

---

### `studyModePrevious()`

Navigate to previous card with wrap-around.

**Actions:**

1. Calculates: `(currentIndex - 1 + deckLength) % deckLength`
2. Clears flip state for new card
3. Calls `renderStudyModeCard()`
4. Announces position to screen reader

---

### `studyModeNext()`

Navigate to next card with wrap-around.

**Actions:**

1. Calculates: `(currentIndex + 1) % deckLength`
2. Clears flip state for new card
3. Calls `renderStudyModeCard()`
4. Announces position to screen reader

---

### `exitStudyMode()`

Exit study mode and return to normal view.

**Cleanup Steps:**

1. Removes keyboard event listener
2. Calculates study session statistics:
   - Cards reviewed count
   - Time spent (minutes and seconds)
3. Restores original UI from backup
4. Clears `studyMode.active` flag
5. Calls `renderCards()` to show normal grid view
6. Announces summary to screen reader
7. Shows alert with session statistics

**Session Summary:**

```
Study Session Complete!

Cards Reviewed: X
Time Spent: Xm Ys
```

---

## State Management

### Study Mode State

```javascript
this.studyMode = {
  active: boolean,           // Is study mode currently active
  deckId: number,            // Which deck is being studied
  currentIndex: number,      // Current card position (0-based)
  startTime: timestamp,      // When study mode started
  cardsStudied: Set<cardId>  // Set of reviewed card IDs
};
```

### Backup State

Stores original UI to restore on exit:

```javascript
this.studyModeBackup = {
  cardsContainerHTML: string,
  cardsContainerDisplay: string,
};
```

### Flip State Map

Persists across navigation within study mode:

```javascript
this.cardFlipState = new Map();
// Example: { "card-1738769234567-a4b2d9c" → true }
```

---

## Accessibility Features

### Screen Reader Support

**Announcements:**

- Study mode initiation with deck name and card count
- Card position on navigation
- Session summary on exit

**ARIA Attributes:**

```html
<article
  class="study-mode-card"
  role="article"
  aria-label="Flashcard"
  tabindex="0"
></article>
```

### Keyboard Navigation

- All features accessible via keyboard
- Tab focuses study card
- Arrow keys + Space work without focus requirement
- Escape is globally available

### Focus Management

- Study card automatically focused after render
- Focus visible on card with `:focus` styles
- Focus trap not needed (single interactive region)

---

## Responsive Design

### Desktop (≥769px)

- Full-size cards (max 600px width)
- Horizontal button layout
- All controls visible

### Tablet (481-768px)

- Adjusted card height (280px)
- Wrapped control buttons if needed
- Touch-friendly button sizes (≥44px)

### Mobile (≤480px)

- Smaller cards (240px height)
- Vertical button layout (100% width)
- Keyboard shortcuts help hidden
- Compact spacing

---

## Performance Considerations

### Rendering

- **Initial:** Full re-render with `renderStudyModeCard()`
- **Navigation:** Re-render only current card (O(1) operation)
- **Flip:** CSS class toggle (no DOM changes)
- **Exit:** Restore from backup HTML (no re-calculation)

### Memory

- Study mode state: ~500 bytes
- Flip state Map: 1 entry per flipped card (~50 bytes each)
- Backup HTML: Original cards container size (typical: <10KB)
- Total: < 50KB for typical 100-card deck

### Animation

- 3D flip uses GPU acceleration
- No layout triggers during animation
- Pure `transform` property changes
- 60fps achievable on modern devices

---

## Error Handling

### Validation

**Before Entering Study Mode:**

```javascript
if (!deck) return alert("Deck not found");
if (deck.cards.length === 0) {
  return alert("This deck has no cards. Add cards before entering study mode.");
}
```

**During Study Mode:**

- Navigation wraps around (never out of bounds)
- Flip state gracefully handles missing card
- Exit always succeeds even if state is corrupted

### Edge Cases

| Scenario                  | Behavior                                      |
| ------------------------- | --------------------------------------------- |
| Empty deck                | Alert shown, study mode not entered           |
| Single card               | Previous/Next wrap to same card               |
| Card deleted during study | No impact (studying cards, not references)    |
| Study mode entered twice  | Second call overwrites first (no nested mode) |
| Exit button missing       | Keyboard Escape still works                   |

---

## Integration Example

### HTML Button

```html
<button
  class="btn btn-primary"
  id="study-mode-btn"
  aria-label="Enter study mode for full-screen card review"
>
  🎓 Study Mode
</button>
```

### JavaScript Event Handler

```javascript
if (e.target.closest("#study-mode-btn")) {
  e.preventDefault();
  const selectedDeck = this.deckManager.getSelectedDeck();
  if (selectedDeck) {
    this.enterStudyMode(selectedDeck.id);
  } else {
    alert("Please select a deck first");
  }
}
```

### User Flow

1. User selects a deck from sidebar
2. Cards appear in grid view
3. User clicks "🎓 Study Mode" button
4. UI transforms to full-screen study interface
5. User navigates with arrow keys / clicks buttons
6. User presses Esc to exit
7. Session summary shown
8. Returns to normal grid view

---

## Testing Checklist

### Functionality

- [ ] Study mode initializes with correct deck
- [ ] Current card displays with front content
- [ ] Card position counter (X of Y) accurate
- [ ] Arrow keys navigate forward/backward
- [ ] Navigation wraps around at boundaries
- [ ] Space key flips card
- [ ] Click on card flips card
- [ ] Previous button works
- [ ] Next button works
- [ ] Exit button returns to normal view
- [ ] Esc key exits study mode

### Accessibility

- [ ] Screen reader announces mode entry
- [ ] Screen reader announces card position on navigation
- [ ] Screen reader announces session summary on exit
- [ ] Keyboard-only navigation works completely
- [ ] Tab focuses study card
- [ ] Focus visible on study card
- [ ] ARIA labels present and accurate

### Responsive

- [ ] Desktop: Cards full-size, horizontal buttons
- [ ] Tablet: Cards medium-size, buttons wrap if needed
- [ ] Mobile: Compact layout, full-width buttons
- [ ] All screen sizes: No content overflow

### Performance

- [ ] Card flip smooth at 60fps
- [ ] Navigation instant (no lag)
- [ ] Exit instant (no lag)
- [ ] No memory leaks (listeners removed)

### Edge Cases

- [ ] Single-card deck: Navigation wraps correctly
- [ ] Large deck (100+ cards): Performance maintained
- [ ] Rapid navigation: No corruption
- [ ] Multiple mode exits: Listeners properly cleaned

---

## Browser Compatibility

✅ **Chrome/Edge** - All features supported
✅ **Firefox** - All features supported  
✅ **Safari** - All features supported (uses `-webkit-` prefix for backface-visibility)
✅ **Mobile Browsers** - All features supported with touch events

---

## Future Enhancements

1. **Spaced Repetition** - Flag cards as hard/medium/easy
2. **Progress Persistence** - Save studied cards locally
3. **Statistics Dashboard** - Detailed study analytics
4. **Shuffle Option** - Random card order during study
5. **Timed Mode** - Study with time limits
6. **Audio** - Text-to-speech for card content
7. **Multi-language** - Keyboard shortcuts for different layouts
8. **Offline Support** - Study mode works without internet

---

## Summary

Study Mode transforms the flashcards app into a focused, distraction-free learning tool with:

- **Immersive Interface** - Full-screen card display
- **Intuitive Controls** - Keyboard shortcuts + button controls
- **Smart Navigation** - Wrap-around with flip state preservation
- **Rich Accessibility** - Screen reader + keyboard support
- **Progress Feedback** - Card counter + session statistics
- **Responsive Design** - Works on all screen sizes
- **Clean Architecture** - Isolated state + proper cleanup

Perfect for active studying and spaced repetition workflows!
