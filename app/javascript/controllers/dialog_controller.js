import { Controller } from "@hotwired/stimulus"
import { orient } from "helpers/orientation_helpers"

export default class extends Controller {
  static targets = [ "dialog" ]
  static values = {
    modal: { type: Boolean, default: false },
    sizing: { type: Boolean, default: true }
  }

  connect() {
    this.dialogTarget.setAttribute("aria-hidden", "true")
  }

  open() {
    const modal = this.modalValue

    if (modal) {
      this.dialogTarget.showModal()
    } else {
      this.dialogTarget.show()
      orient(this.dialogTarget)
    }

    this.loadLazyFrames()
    this.#autofocusDesktopInputs()
    this.dialogTarget.setAttribute("aria-hidden", "false")
    this.dispatch("show")
  }

  toggle() {
    if (this.dialogTarget.open) {
      this.close()
    } else {
      this.open()
    }
  }

  close() {
    this.dialogTarget.close()
    this.dialogTarget.setAttribute("aria-hidden", "true")
    this.dialogTarget.blur()
    orient(this.dialogTarget, false)
    this.dispatch("close")
  }

  closeOnClickOutside({ target }) {
    if (!this.element.contains(target)) this.close()
  }

  preventCloseOnMorphing(event) {
    if (event.detail?.attributeName === "open") {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  loadLazyFrames() {
    Array.from(this.dialogTarget.querySelectorAll("turbo-frame")).forEach(frame => { frame.loading = "eager" })
  }

  // Focus search input on desktop only (not touch-primary devices where it would open keyboard)
  #autofocusDesktopInputs() {
    // Use CSS media query to check if device has hover capability (mouse/trackpad)
    // This is more reliable than checking for touch support since many laptops have both
    const hasHover = window.matchMedia("(any-hover: hover)").matches
    if (!hasHover) return
    
    const input = this.dialogTarget.querySelector("[data-autofocus-desktop]")
    if (input) {
      // Small delay to ensure dialog is fully rendered
      requestAnimationFrame(() => input.focus())
    }
  }
}
