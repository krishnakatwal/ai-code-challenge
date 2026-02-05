/**
 * Accessible Modal Component
 * Features:
 * - Focus trap (keyboard focus stays within modal)
 * - ESC key to close
 * - Returns focus to opening element
 * - ARIA attributes for screen readers
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

  /**
   * Initialize modal event listeners
   */
  init() {
    // Setup modal attributes
    this.modal.setAttribute("role", "dialog");
    this.modal.setAttribute("aria-modal", "true");
    if (!this.modal.id) {
      this.modal.id = `modal-${Date.now()}`;
    }

    // Get close button and add listener
    const closeButton = this.modal.querySelector(
      this.options.closeButtonSelector,
    );
    if (closeButton) {
      closeButton.addEventListener("click", () => this.close());
    }

    // Backdrop click handling
    const backdrop = this.modal.parentElement;
    if (this.options.closeOnBackdropClick && backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          this.close();
        }
      });
    }

    // Keyboard event listener (attached when modal opens)
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Get all focusable elements within the modal
   */
  getFocusableElements() {
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      'input[type="text"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");

    return Array.from(this.modal.querySelectorAll(focusableSelectors));
  }

  /**
   * Trap focus within modal
   */
  trapFocus(e) {
    const focusableElements = this.focusableElements;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.key === "Tab") {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  /**
   * Handle keyboard events
   */
  handleKeyDown(e) {
    // ESC to close
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }

    // Focus trap
    if (this.focusableElements.length > 0) {
      this.trapFocus(e);
    }
  }

  /**
   * Open the modal
   */
  open(triggerElement = null) {
    // Store the element that triggered the modal open
    this.previouslyFocusedElement = triggerElement || document.activeElement;

    // Get focusable elements
    this.focusableElements = this.getFocusableElements();
    if (this.focusableElements.length === 0) {
      console.warn("Modal has no focusable elements");
    }

    // Show modal
    this.modal.style.display = "block";
    this.modal.setAttribute("aria-hidden", "false");

    // Set focus to first focusable element or modal itself
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    } else {
      this.modal.focus();
    }

    // Add keyboard event listener
    document.addEventListener("keydown", this.handleKeyDown);
    this.focusTrapActive = true;

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Announce to screen readers
    this.announceToScreenReader("Dialog opened");
  }

  /**
   * Close the modal
   */
  close() {
    // Hide modal
    this.modal.style.display = "none";
    this.modal.setAttribute("aria-hidden", "true");

    // Remove keyboard event listener
    document.removeEventListener("keydown", this.handleKeyDown);
    this.focusTrapActive = false;

    // Restore body scroll
    document.body.style.overflow = "";

    // Return focus to opener
    if (
      this.previouslyFocusedElement &&
      typeof this.previouslyFocusedElement.focus === "function"
    ) {
      this.previouslyFocusedElement.focus();
    }

    // Announce to screen readers
    this.announceToScreenReader("Dialog closed");
  }

  /**
   * Announce messages to screen readers
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

  /**
   * Toggle modal visibility
   */
  toggle(triggerElement = null) {
    if (this.modal.style.display === "none" || !this.modal.style.display) {
      this.open(triggerElement);
    } else {
      this.close();
    }
  }

  /**
   * Check if modal is open
   */
  isOpen() {
    return this.modal.style.display === "block";
  }

  /**
   * Destroy modal instance and cleanup
   */
  destroy() {
    document.removeEventListener("keydown", this.handleKeyDown);
    this.modal = null;
    this.previouslyFocusedElement = null;
    this.focusableElements = [];
  }
}

export default AccessibleModal;
