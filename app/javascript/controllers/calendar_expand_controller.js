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
    
    // When collapsing, we need to ensure exactly 1 visible card and hide the rest
    // Cards may have been added/removed while expanded
    const container = this.element
    const allCards = Array.from(container.querySelectorAll(".calendar__card"))
    
    if (allCards.length === 0) {
      // No cards, remove the button
      if (this.hasToggleTarget) {
        this.toggleTarget.remove()
      }
      return
    }
    
    // Ensure first card is visible, rest are hidden
    allCards.forEach((card, index) => {
      if (index === 0) {
        card.classList.remove("calendar__card--hidden")
        card.removeAttribute("data-calendar-expand-target")
      } else {
        card.classList.add("calendar__card--hidden")
        card.setAttribute("data-calendar-expand-target", "hidden")
      }
    })
    
    const hiddenCount = allCards.length - 1
    
    if (this.hasToggleTarget) {
      if (hiddenCount > 0) {
        this.#setToggleText(`+${hiddenCount} more`)
      } else {
        // Only 1 card, no need for more button
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
