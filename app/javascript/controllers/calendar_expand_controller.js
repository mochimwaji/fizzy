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
    this.hiddenTargets.forEach(card => {
      card.classList.remove("calendar__card--hidden")
    })
    this.toggleTarget.textContent = "Show less"
  }
  
  collapse(day) {
    day.classList.remove("calendar__day--expanded")
    this.hiddenTargets.forEach(card => {
      card.classList.add("calendar__card--hidden")
    })
    const hiddenCount = this.hiddenTargets.length
    this.toggleTarget.textContent = `+${hiddenCount} more`
  }
}
