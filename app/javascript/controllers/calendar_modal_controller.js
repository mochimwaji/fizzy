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
  }

  disconnect() {
    document.body.style.overflow = ""
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
      // Refresh the page to update calendar with any due date changes
      window.Turbo.visit(window.location.href, { action: "replace" })
    }, 200)
  }
}
