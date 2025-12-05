import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]

  connect() {
    // Animate in on connect
    requestAnimationFrame(() => {
      this.element.classList.add("calendar-modal--open")
    })
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden"
    
    // Track whether calendar needs refresh (due date changed)
    this.needsRefresh = false
    
    // Watch for due date changes (signaled by data-calendar-refresh elements)
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1 && node.dataset && node.dataset.calendarRefresh) {
            this.needsRefresh = true
            node.remove() // Clean up the signal element
          }
        }
      }
    })
    this.observer.observe(this.element, { childList: true, subtree: true })
  }

  disconnect() {
    document.body.style.overflow = ""
    if (this.observer) {
      this.observer.disconnect()
    }
  }

  close(event) {
    if (event) {
      event.preventDefault()
    }

    // Animate out
    this.element.classList.remove("calendar-modal--open")
    this.element.classList.add("calendar-modal--closing")

    // Navigate back after animation and refresh calendar if needed
    setTimeout(() => {
      const frame = document.getElementById("calendar_card_modal")
      if (frame) {
        frame.innerHTML = ""
      }
      // Always refresh to update calendar with any due date changes
      // Using replace to avoid adding to browser history
      window.Turbo.visit(window.location.href, { action: "replace" })
    }, 200)
  }
}
