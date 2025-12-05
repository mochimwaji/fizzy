import { Controller } from "@hotwired/stimulus"
import { patch } from "@rails/request.js"
import {
  isTouchDevice,
  getTouchPosition,
  exceedsDragThreshold,
  hapticFeedback,
  createDragPreview,
  moveDragPreview,
  removeDragPreview,
  getElementAtTouch,
  preventTouchDefault,
  preventContextMenu,
  LONG_PRESS_DURATION
} from "helpers/touch_helpers"

export default class extends Controller {
  static targets = ["card", "day"]
  static values = { updateUrl: String }
  
  connect() {
    if (isTouchDevice()) {
      this.#bindTouchEvents()
      // Prevent context menu on all cards for mobile drag
      this.cardTargets.forEach(card => preventContextMenu(card))
    }
  }
  
  disconnect() {
    this.#cleanupTouch()
    if (isTouchDevice()) {
      this.#unbindTouchEvents()
    }
  }
  
  // Called when new card targets are added (e.g., via Turbo)
  cardTargetConnected(card) {
    if (isTouchDevice()) {
      preventContextMenu(card)
    }
  }
  
  // ========================================
  // Desktop Drag and Drop (HTML5 API)
  // ========================================
  
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
    
    await this.#updateCardDueDate(cardId, newDate, this.draggedCard)
  }
  
  // ========================================
  // Touch Drag and Drop (Mobile)
  // ========================================
  
  #bindTouchEvents() {
    this.boundTouchStart = this.#handleTouchStart.bind(this)
    this.boundTouchMove = this.#handleTouchMove.bind(this)
    this.boundTouchEnd = this.#handleTouchEnd.bind(this)
    this.boundTouchCancel = this.#handleTouchCancel.bind(this)

    this.element.addEventListener("touchstart", this.boundTouchStart, { passive: false })
    this.element.addEventListener("touchmove", this.boundTouchMove, { passive: false })
    this.element.addEventListener("touchend", this.boundTouchEnd, { passive: false })
    this.element.addEventListener("touchcancel", this.boundTouchCancel, { passive: false })
  }

  #unbindTouchEvents() {
    if (this.boundTouchStart) {
      this.element.removeEventListener("touchstart", this.boundTouchStart)
      this.element.removeEventListener("touchmove", this.boundTouchMove)
      this.element.removeEventListener("touchend", this.boundTouchEnd)
      this.element.removeEventListener("touchcancel", this.boundTouchCancel)
    }
  }

  #handleTouchStart(event) {
    const card = event.target.closest(".calendar__card")
    if (!card) return

    const position = getTouchPosition(event)
    if (!position) return

    this.touchStartPosition = position
    this.touchCurrentPosition = position
    this.potentialDragCard = card
    this.isDragging = false

    // Calculate offset
    const rect = card.getBoundingClientRect()
    this.touchOffset = {
      x: position.x - rect.left,
      y: position.y - rect.top
    }

    // Long-press to initiate drag
    this.longPressTimer = setTimeout(() => {
      this.#startTouchDrag(card, position)
    }, LONG_PRESS_DURATION)
  }

  #handleTouchMove(event) {
    const position = getTouchPosition(event)
    if (!position) return

    this.touchCurrentPosition = position

    if (!this.isDragging) {
      // Cancel if moved too much before long-press
      if (this.longPressTimer && exceedsDragThreshold(this.touchStartPosition, position)) {
        this.#cancelLongPress()
        return
      }
      return
    }

    preventTouchDefault(event)

    // Move preview
    moveDragPreview(this.dragPreview, position, this.touchOffset)

    // Find day under touch
    const elementUnder = getElementAtTouch(position, this.dragPreview)
    const day = elementUnder?.closest(".calendar__day")

    // Clear all highlights
    this.dayTargets.forEach(d => d.classList.remove("calendar__day--drop-target"))

    if (day && day !== this.sourceDay) {
      day.classList.add("calendar__day--drop-target")
      this.currentDropTarget = day
    } else {
      this.currentDropTarget = null
    }
  }

  #handleTouchEnd(event) {
    this.#cancelLongPress()

    if (!this.isDragging) {
      this.#cleanupTouch()
      return
    }

    preventTouchDefault(event)

    // Process drop
    if (this.currentDropTarget && this.currentDropTarget !== this.sourceDay) {
      hapticFeedback("success")
      const cardId = this.draggedCard.dataset.cardId
      const newDate = this.currentDropTarget.dataset.date
      
      if (cardId && newDate) {
        this.#updateCardDueDate(cardId, newDate, this.draggedCard)
      }
    }

    this.#endTouchDrag()
  }

  #handleTouchCancel() {
    this.#cancelLongPress()
    this.#endTouchDrag()
  }

  #startTouchDrag(card, position) {
    this.isDragging = true
    this.draggedCard = card
    this.sourceDay = card.closest(".calendar__day")

    hapticFeedback("medium")

    // Create preview
    this.dragPreview = createDragPreview(card, {
      opacity: "0.95",
      transform: "scale(1.1) rotate(2deg)"
    })

    // Style original
    card.classList.add("calendar__card--dragging")
    this.sourceDay.classList.add("calendar__day--source")

    moveDragPreview(this.dragPreview, position, this.touchOffset)
  }

  #endTouchDrag() {
    if (this.draggedCard) {
      this.draggedCard.classList.remove("calendar__card--dragging")
    }

    if (this.sourceDay) {
      this.sourceDay.classList.remove("calendar__day--source")
    }

    this.dayTargets.forEach(day => {
      day.classList.remove("calendar__day--drop-target")
    })

    removeDragPreview(this.dragPreview)
    this.#cleanupTouch()
  }

  #cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }

  #cleanupTouch() {
    this.#cancelLongPress()
    this.touchStartPosition = null
    this.touchCurrentPosition = null
    this.potentialDragCard = null
    this.isDragging = false
    this.dragPreview = null
    this.currentDropTarget = null
    this.touchOffset = null
    this.sourceDay = null
    this.draggedCard = null
  }

  // ========================================
  // Shared Helpers
  // ========================================

  async #updateCardDueDate(cardId, newDate, card) {
    const url = this.updateUrlValue.replace("__CARD_ID__", cardId)
    
    // Animate the card
    if (card) {
      card.style.transition = "all 0.3s ease"
      card.style.opacity = "0"
      card.style.transform = "scale(0.8)"
    }
    
    const response = await patch(url, {
      body: JSON.stringify({ due_date: { due_on: newDate } }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/vnd.turbo-stream.html, text/html, application/xhtml+xml"
      }
    })
    
    if (response.ok) {
      // Force a full page refresh to update the calendar
      // Using location.reload instead of Turbo.visit for more reliable updates
      window.location.reload()
    }
  }
}
