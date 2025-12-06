import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["hidden", "toggle"]
  
  toggle() {
    const day = this.element.closest(".calendar__day")
    const isExpanded = day.classList.contains("calendar__day--expanded")
    
    if (isExpanded) {
      this.collapse(day)
    } else {
      this.expand(day)
    }
  }
  
  expand(day) {
    day.classList.add("calendar__day--expanded")
    
    // CSS handles showing hidden cards via .calendar__day--expanded .calendar__card--hidden
    // We don't modify the hidden class - just toggle the expanded state
    
    if (this.hasToggleTarget) {
      this.#setToggleText("Show less")
    }
  }
  
  collapse(day) {
    day.classList.remove("calendar__day--expanded")
    
    // CSS will automatically hide cards with .calendar__card--hidden class
    // Update the button text to show current hidden count
    const container = this.element
    const hiddenCards = container.querySelectorAll(".calendar__card--hidden")
    
    if (this.hasToggleTarget) {
      if (hiddenCards.length > 0) {
        this.#setToggleText(`+${hiddenCards.length} more`)
      } else {
        // No hidden cards, remove the button
        this.toggleTarget.remove()
      }
    }
  }
  
  #setToggleText(text) {
    // Find the text span inside the button, or update button directly
    const textSpan = this.toggleTarget.querySelector(".calendar__more-text")
    if (textSpan) {
      textSpan.textContent = text
    } else {
      // If no span exists (e.g., button was created without one), wrap text in span
      this.toggleTarget.innerHTML = `<span class="calendar__more-text">${text}</span>`
    }
  }
}
