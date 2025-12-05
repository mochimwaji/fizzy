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
    
    // Create a custom drag image
    const dragImage = card.cloneNode(true)
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    dragImage.style.transform = "rotate(3deg) scale(1.05)"
    dragImage.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.25)"
    dragImage.style.opacity = "0.95"
    dragImage.style.width = `${card.offsetWidth}px`
    document.body.appendChild(dragImage)
    event.dataTransfer.setDragImage(dragImage, card.offsetWidth / 2, card.offsetHeight / 2)
    
    // Clean up drag image after a frame
    setTimeout(() => dragImage.remove(), 0)
    
    // Add dragging class after a frame to avoid affecting drag image
    requestAnimationFrame(() => {
      card.classList.add("calendar__card--dragging")
      this.sourceDay.classList.add("calendar__day--source")
    })
  }
  
  dragEnd(event) {
    if (this.draggedCard) {
      this.draggedCard.classList.remove("calendar__card--dragging")
    }
    
    if (this.sourceDay) {
      this.sourceDay.classList.remove("calendar__day--source")
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
    
    // Clear other highlights first
    this.dayTargets.forEach(d => {
      if (d !== day) d.classList.remove("calendar__day--drop-target")
    })
    
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
    
    // Add a subtle animation to the dropped card placeholder
    if (this.draggedCard) {
      this.draggedCard.style.transition = "all 0.3s ease"
      this.draggedCard.style.opacity = "0"
      this.draggedCard.style.transform = "scale(0.8)"
    }
    
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
      window.Turbo.visit(window.location.href, { action: "replace" })
    }
  }
}
