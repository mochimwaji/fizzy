import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]
  static values = {
    calendarUrl: String
  }

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
    // Need to observe the parent turbo-frame since turbo_stream.append targets the frame ID
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
    
    // Observe the turbo-frame parent, not just this element
    const frame = this.element.closest("turbo-frame") || this.element
    this.observer.observe(frame, { childList: true, subtree: true })
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

    // Navigate back after animation and refresh calendar
    setTimeout(() => {
      const frame = document.getElementById("calendar_card_modal")
      if (frame) {
        frame.innerHTML = ""
      }
      // Navigate to the calendar URL (with date) to refresh with any due date changes
      // Using the explicit calendar URL ensures we go back to the right month
      const calendarUrl = this.hasCalendarUrlValue ? this.calendarUrlValue : window.location.pathname.replace(/\/cards\/.*$/, "")
      window.Turbo.visit(calendarUrl, { action: "replace" })
    }, 200)
  }
}
