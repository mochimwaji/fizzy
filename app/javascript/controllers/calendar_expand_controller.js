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
    
    // Show all hidden cards
    this.hiddenTargets.forEach(card => {
      card.classList.remove("calendar__card--hidden")
    })
    
    if (this.hasToggleTarget) {
      this.toggleTarget.textContent = "Show less"
    }
  }
  
  collapse(day) {
    day.classList.remove("calendar__day--expanded")
    
    // Get all cards in this container
    const container = this.element
    const allCards = container.querySelectorAll(".calendar__card")
    
    // Keep only the first card visible, hide the rest
    let visibleCount = 0
    let hiddenCount = 0
    
    allCards.forEach(card => {
      if (visibleCount === 0) {
        // Keep the first card visible
        card.classList.remove("calendar__card--hidden")
        card.removeAttribute("data-calendar-expand-target")
        visibleCount++
      } else {
        // Hide all subsequent cards
        card.classList.add("calendar__card--hidden")
        card.setAttribute("data-calendar-expand-target", "hidden")
        hiddenCount++
      }
    })
    
    if (this.hasToggleTarget) {
      if (hiddenCount > 0) {
        this.toggleTarget.textContent = `+${hiddenCount} more`
      } else {
        // No hidden cards, remove the button
        this.toggleTarget.closest(".calendar__more")?.remove()
      }
    }
  }
}
