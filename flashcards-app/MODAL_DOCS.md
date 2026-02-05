# Accessible Modal Component Documentation

## Overview

A lightweight, accessible modal dialog component built with vanilla JavaScript that provides an excellent user experience for both keyboard and screen reader users.

## Features

### ✅ Core Accessibility Features

1. **Focus Trap** - Keyboard focus stays within the modal when it's open
2. **ESC to Close** - Users can press Escape key to close the modal
3. **Return Focus** - Focus returns to the element that opened the modal
4. **ARIA Attributes** - Proper semantic markup for screen readers
5. **Screen Reader Announcements** - Users are notified when modal opens/closes

### ✅ Keyboard Navigation

- **Tab** - Move focus to next focusable element (cycles within modal)
- **Shift + Tab** - Move focus to previous focusable element
- **Escape** - Close the modal
- **Click Backdrop** - Close the modal (optional, configurable)

## Usage

### HTML Structure

```html
<!-- Modal Backdrop -->
<div class="modal-backdrop" id="modalBackdrop">
  <!-- Modal Dialog -->
  <div class="modal" id="myModal" aria-labelledby="modalTitle">
    <!-- Modal Header -->
    <div class="modal-header">
      <h2 id="modalTitle">Modal Title</h2>
      <button class="modal-close" data-modal-close aria-label="Close dialog">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="modal-body">
      <p>Your content here</p>
      <input type="text" id="myInput" />
    </div>

    <!-- Modal Footer -->
    <div class="modal-footer">
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="confirmBtn">Confirm</button>
    </div>
  </div>
</div>

<!-- Trigger Button -->
<button id="openModalBtn">Open Modal</button>

<!-- Scripts -->
<script src="modal.js"></script>
<script src="app.js"></script>
```

### JavaScript Implementation

```javascript
// Create modal instance
const modal = new AccessibleModal("#myModal");

// Get backdrop and trigger button
const backdrop = document.getElementById("modalBackdrop");
const openBtn = document.getElementById("openModalBtn");

// Open modal on button click
openBtn.addEventListener("click", (e) => {
  backdrop.classList.add("open");
  modal.open(e.target); // Pass the trigger element
});

// Handle confirm action
document.getElementById("confirmBtn").addEventListener("click", () => {
  const value = document.getElementById("myInput").value;
  console.log("User input:", value);
  backdrop.classList.remove("open");
  modal.close();
});

// Handle close action
document.querySelectorAll("[data-modal-close]").forEach((btn) => {
  btn.addEventListener("click", () => {
    backdrop.classList.remove("open");
    modal.close();
  });
});
```

## API Reference

### Constructor

```javascript
const modal = new AccessibleModal(modalSelector, options);
```

**Parameters:**

- `modalSelector` (string) - CSS selector for the modal element
- `options` (object, optional):
  - `closeButtonSelector` (string, default: `'[data-modal-close]'`) - Selector for close buttons
  - `closeOnBackdropClick` (boolean, default: `true`) - Close modal when clicking backdrop

### Methods

#### `open(triggerElement)`

Opens the modal and sets focus to first focusable element.

- **Parameters:** `triggerElement` (Element, optional) - Element that triggered the modal
- **Returns:** void

```javascript
const trigger = document.getElementById("openBtn");
modal.open(trigger);
```

#### `close()`

Closes the modal and returns focus to the trigger element.

- **Returns:** void

```javascript
modal.close();
```

#### `toggle(triggerElement)`

Toggles modal open/close state.

- **Parameters:** `triggerElement` (Element, optional)
- **Returns:** void

```javascript
modal.toggle(triggerElement);
```

#### `isOpen()`

Checks if modal is currently open.

- **Returns:** boolean

```javascript
if (modal.isOpen()) {
  console.log("Modal is open");
}
```

#### `destroy()`

Cleans up modal instance and removes event listeners.

- **Returns:** void

```javascript
modal.destroy();
```

## CSS Classes

### Structure Classes

- `.modal-backdrop` - Overlay backdrop
- `.modal` - Modal dialog container
- `.modal-header` - Header section
- `.modal-body` - Content section
- `.modal-footer` - Footer section
- `.modal-close` - Close button
- `.modal-input` - Input field styling

### State Classes

- `.open` - Applied to backdrop when modal is open

### Data Attributes

- `data-modal-close` - Used to identify close buttons

## Accessibility Features

### ARIA Attributes

```html
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
  <h2 id="modalTitle">Modal Title</h2>
</div>
```

### Focus Management

- First focusable element receives focus when modal opens
- Focus is trapped within modal using Tab/Shift+Tab
- Focus returns to opener when modal closes

### Screen Reader Support

- Modal title labeled with `aria-labelledby`
- Inputs have associated labels
- Helper text uses `aria-describedby`
- Close button has descriptive `aria-label`
- Decorator content marked with `aria-hidden="true"`

## Styling

The component uses CSS variables for consistent theming:

- `--primary-color` - Primary button color
- `--bg-secondary` - Modal background
- `--text-primary` - Primary text color
- `--border-color` - Border/divider color
- `--shadow-lg` - Large shadow effect
- `--spacing-*` - Spacing scale

## Responsive Design

The modal adapts to different screen sizes:

- Desktop: Full width/height constraints with padding
- Tablet: 95% width, 80% max-height
- Mobile: 95% width, 80% max-height, stacked footer buttons

## Example Integration

See `index.html` and `app.js` for a complete example with the "Create New Deck" modal.

### Key Example Points:

1. Modal created for creating new decks
2. "Add Deck" button triggers modal with focus trap
3. Input field for deck name with proper labels
4. Cancel and Confirm buttons with proper event handling
5. All ARIA attributes properly configured

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE 11: ⚠️ Requires polyfills for some features

## Best Practices

1. **Always provide a descriptive title** - Use `aria-labelledby` pointing to heading
2. **Include close button** - Always provide an obvious way to close
3. **Use semantic HTML** - Use `<button>` for buttons, `<label>` for form labels
4. **Provide escape hatch** - Allow ESC key to close modal
5. **Return focus** - Pass trigger element to `open()` method
6. **Test with keyboard** - Verify Tab navigation works
7. **Test with screen readers** - Use NVDA, JAWS, or VoiceOver

## Troubleshooting

### Focus not trapping

- Ensure buttons are not disabled
- Check that all focusable elements are within the modal
- Verify no `tabindex="-1"` on elements you want focusable

### Modal not closing on ESC

- Ensure `document` has focus (not iframe)
- Check that modal is highest z-index layer
- Verify event listener is attached

### Focus not returning to opener

- Pass trigger element to `open()` method
- Ensure element still exists when modal closes
- Check that element is focusable (not disabled)

## Performance Considerations

- Modal uses efficient event delegation
- CSS animations are GPU-accelerated
- No heavy DOM manipulation
- Minimal JavaScript footprint (~4KB minified)

## License

Free to use and modify for your projects.
