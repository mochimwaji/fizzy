import { Controller } from "@hotwired/stimulus"

/**
 * OptimisticUIController
 *
 * Provides instant visual feedback for user actions before server confirmation.
 * This makes the app feel more responsive by immediately reflecting user intent.
 *
 * Usage:
 *   <button data-controller="optimistic-ui"
 *           data-action="click->optimistic-ui#addFeedback"
 *           data-optimistic-ui-success-class-value="btn--success">
 *
 *   <form data-controller="optimistic-ui"
 *         data-action="submit->optimistic-ui#submitWithFeedback">
 */
export default class extends Controller {
  static values = {
    successClass: String,
    pendingClass: { type: String, default: "is-pending" },
    errorClass: { type: String, default: "is-error" },
    hideOnSubmit: Boolean,
    disableOnSubmit: { type: Boolean, default: true }
  }

  static targets = ["pending", "success", "error"]

  connect() {
    this.originalState = {
      classList: [...this.element.classList],
      disabled: this.element.disabled
    }
  }

  // Add immediate feedback on click
  addFeedback(event) {
    this.element.classList.add(this.pendingClassValue)

    if (this.disableOnSubmitValue) {
      this.element.disabled = true
    }
  }

  // Form submission with optimistic feedback
  submitWithFeedback(event) {
    // Show pending state
    this.element.classList.add(this.pendingClassValue)

    // Hide submit button content and show pending state
    if (this.hasPendingTarget) {
      this.pendingTarget.hidden = false
    }

    // Disable form elements
    if (this.disableOnSubmitValue) {
      this.#disableFormElements()
    }

    // Hide element entirely if configured
    if (this.hideOnSubmitValue) {
      this.element.style.opacity = "0.5"
      this.element.style.pointerEvents = "none"
    }
  }

  // Called when the server responds successfully
  showSuccess() {
    this.element.classList.remove(this.pendingClassValue)

    if (this.successClassValue) {
      this.element.classList.add(this.successClassValue)
    }

    if (this.hasSuccessTarget) {
      this.successTarget.hidden = false
    }

    if (this.hasPendingTarget) {
      this.pendingTarget.hidden = true
    }

    // Reset after animation
    setTimeout(() => this.reset(), 1500)
  }

  // Called when the server responds with an error
  showError() {
    this.element.classList.remove(this.pendingClassValue)
    this.element.classList.add(this.errorClassValue)

    if (this.hasErrorTarget) {
      this.errorTarget.hidden = false
    }

    if (this.hasPendingTarget) {
      this.pendingTarget.hidden = true
    }

    // Re-enable form elements
    this.#enableFormElements()

    // Reset after delay
    setTimeout(() => this.reset(), 2000)
  }

  // Reset to original state
  reset() {
    this.element.classList.remove(this.pendingClassValue, this.errorClassValue)

    if (this.successClassValue) {
      this.element.classList.remove(this.successClassValue)
    }

    if (this.hasPendingTarget) {
      this.pendingTarget.hidden = true
    }

    if (this.hasSuccessTarget) {
      this.successTarget.hidden = true
    }

    if (this.hasErrorTarget) {
      this.errorTarget.hidden = true
    }

    this.#enableFormElements()

    this.element.style.opacity = ""
    this.element.style.pointerEvents = ""
  }

  // Private methods

  #disableFormElements() {
    const inputs = this.element.querySelectorAll("input, button, select, textarea")
    inputs.forEach(input => {
      input.disabled = true
    })
  }

  #enableFormElements() {
    const inputs = this.element.querySelectorAll("input, button, select, textarea")
    inputs.forEach(input => {
      input.disabled = false
    })
  }
}
