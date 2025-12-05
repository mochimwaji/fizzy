import { Controller } from "@hotwired/stimulus"
import { patch } from "@rails/request.js"

export default class extends Controller {
  static targets = ["card", "day"]
  static values = { updateUrl: String }
  
  dragStart(event) {
    const card = event.target.closest(".calendar__card")
    if (!card) return
    
    this.draggedCard = card
    this.sourceDay = card.closest(".calendar__day")
    
    // Set drag data
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", card.dataset.cardId)
    
    // Add dragging class after a frame to avoid affecting drag image
    requestAnimationFrame(() => {
      card.classList.add("calendar__card--dragging")
    })
  }
  
  dragEnd(event) {
    if (this.draggedCard) {
      this.draggedCard.classList.remove("calendar__card--dragging")
    }
    
    // Clear all drop target highlights
    this.dayTargets.forEach(day => {
      day.classList.remove("calendar__day--drop-target")
    })
    
    this.draggedCard = null
    this.sourceDay = null
  }
  
  dragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }
  
  dragEnter(event) {
    const day = event.target.closest(".calendar__day")
    if (!day || day === this.sourceDay) return
    
    day.classList.add("calendar__day--drop-target")
  }
  
  dragLeave(event) {
    const day = event.target.closest(".calendar__day")
    if (!day) return
    
    // Only remove if we're actually leaving the day element
    const relatedTarget = event.relatedTarget
    if (relatedTarget && day.contains(relatedTarget)) return
    
    day.classList.remove("calendar__day--drop-target")
  }
  
  async drop(event) {
    event.preventDefault()
    
    const day = event.target.closest(".calendar__day")
    if (!day || day === this.sourceDay) return
    
    day.classList.remove("calendar__day--drop-target")
    
    const cardId = event.dataTransfer.getData("text/plain")
    const newDate = day.dataset.date
    
    if (!cardId || !newDate) return
    
    // Build the URL for updating the due date
    const url = this.updateUrlValue.replace("__CARD_ID__", cardId)
    
    // Send PATCH request to update due date
    const response = await patch(url, {
      body: JSON.stringify({ due_date: { due_on: newDate } }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/vnd.turbo-stream.html, text/html, application/xhtml+xml"
      }
    })
    
    if (response.ok) {
      // Reload the calendar to show updated positions
      // The turbo stream from the controller will handle this
      window.Turbo.visit(window.location.href, { action: "replace" })
    }
  }
}
