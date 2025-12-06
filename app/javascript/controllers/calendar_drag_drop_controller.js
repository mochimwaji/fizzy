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
    const sourceDay = card?.closest(".calendar__day")
    const targetDay = this.dayTargets.find(d => d.dataset.date === newDate)
    
    // Optimistically move the card to the new day
    if (card && targetDay && sourceDay !== targetDay) {
      const targetCardsContainer = targetDay.querySelector(".calendar__cards")
      const sourceCardsContainer = sourceDay?.querySelector(".calendar__cards")
      
      // Count cards properly - hidden class is always present on hidden cards, even when expanded
      const allCardsInTarget = targetCardsContainer?.querySelectorAll(".calendar__card") || []
      const hiddenCardsInTarget = targetCardsContainer?.querySelectorAll(".calendar__card--hidden") || []
      const visibleCardsInTarget = allCardsInTarget.length - hiddenCardsInTarget.length
      const moreButton = targetCardsContainer?.querySelector(".calendar__more")
      const isTargetExpanded = targetDay.classList.contains("calendar__day--expanded")
      
      // Create a clone of the dragged card
      const cardClone = card.cloneNode(true)
      cardClone.classList.remove("calendar__card--dragging")
      
      // Find the insertion point - before the more button or drop zone
      const insertBeforeElement = moreButton || targetCardsContainer?.querySelector(".calendar__drop-zone")
      
      // Determine if the new card should be visible or hidden
      // Rule: Only 1 visible card per day when collapsed, all visible when expanded
      const shouldBeHidden = visibleCardsInTarget >= 1 && !isTargetExpanded
      
      if (shouldBeHidden) {
        // Add as hidden card and update +X more
        cardClone.classList.add("calendar__card--hidden")
        cardClone.setAttribute("data-calendar-expand-target", "hidden")
        
        if (insertBeforeElement) {
          targetCardsContainer.insertBefore(cardClone, insertBeforeElement)
        } else if (targetCardsContainer) {
          targetCardsContainer.appendChild(cardClone)
        }
        
        // Update or create +X more button
        this.#updateMoreButtonForAdd(targetCardsContainer, moreButton)
      } else {
        // Add as visible card
        cardClone.classList.remove("calendar__card--hidden")
        cardClone.removeAttribute("data-calendar-expand-target")
        cardClone.style.transition = "all 0.3s ease"
        cardClone.style.opacity = "0"
        cardClone.style.transform = "scale(0.9)"
        
        if (insertBeforeElement) {
          targetCardsContainer.insertBefore(cardClone, insertBeforeElement)
        } else if (targetCardsContainer) {
          targetCardsContainer.appendChild(cardClone)
        }
        
        // Animate in
        requestAnimationFrame(() => {
          cardClone.style.opacity = "1"
          cardClone.style.transform = "scale(1)"
        })
        
        // If target is expanded and there's a more button, we need to mark this card
        // as hidden (for when it collapses) if there's already a visible card
        if (isTargetExpanded && visibleCardsInTarget >= 1) {
          cardClone.classList.add("calendar__card--hidden")
          cardClone.setAttribute("data-calendar-expand-target", "hidden")
          if (moreButton) {
            this.#incrementMoreCount(moreButton, 1)
          }
        }
      }
      
      // Handle source - remove card and possibly reveal a hidden one
      this.#removeCardFromSource(card, sourceCardsContainer, sourceDay)
    }
    
    // Send request to server - Turbo Stream will handle any additional updates
    const response = await patch(url, {
      body: JSON.stringify({ due_date: { due_on: newDate } }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/vnd.turbo-stream.html, text/html, application/xhtml+xml"
      }
    })
    
    // No reload needed - optimistic UI already updated, Turbo Stream handles server response
    if (!response.ok) {
      // If failed, reload to restore correct state
      window.location.reload()
    }
  }
  
  #removeCardFromSource(card, sourceCardsContainer, sourceDay) {
    const wasHidden = card.classList.contains("calendar__card--hidden")
    const isExpanded = sourceDay?.classList.contains("calendar__day--expanded")
    
    // Animate and remove the card
    card.style.transition = "all 0.2s ease"
    card.style.opacity = "0"
    card.style.transform = "scale(0.8)"
    
    setTimeout(() => {
      card.remove()
      
      // Always check if we need to clean up the more button or reveal cards
      if (sourceCardsContainer) {
        this.#handleSourceCardRemoval(sourceCardsContainer, sourceDay, isExpanded, wasHidden)
      }
    }, 200)
  }
  
  #handleSourceCardRemoval(container, day, wasExpanded, wasHiddenCard) {
    const allCards = container.querySelectorAll(".calendar__card")
    const hiddenCards = container.querySelectorAll(".calendar__card--hidden")
    const visibleCards = allCards.length - hiddenCards.length
    const moreButton = container.querySelector(".calendar__more")
    
    // If no cards at all remain, remove the more button and collapse the day
    if (allCards.length === 0) {
      if (moreButton) {
        moreButton.remove()
      }
      if (day) {
        day.classList.remove("calendar__day--expanded")
      }
      return
    }
    
    // If the removed card was hidden, just decrement the count
    if (wasHiddenCard && moreButton) {
      this.#decrementMoreCount(moreButton)
      return
    }
    
    // A visible card was removed - we need to reveal a hidden card if any
    if (hiddenCards.length > 0) {
      // Reveal the first hidden card
      const cardToReveal = hiddenCards[0]
      cardToReveal.classList.remove("calendar__card--hidden")
      cardToReveal.removeAttribute("data-calendar-expand-target")
      
      // Animate the reveal
      cardToReveal.style.transition = "all 0.3s ease"
      cardToReveal.style.opacity = "0"
      requestAnimationFrame(() => {
        cardToReveal.style.opacity = "1"
      })
      
      // Decrement the +X more count
      if (moreButton) {
        this.#decrementMoreCount(moreButton)
      }
    }
  }
  
  #updateMoreButtonForAdd(container, existingButton) {
    if (existingButton) {
      this.#incrementMoreCount(existingButton, 1)
    } else {
      // Create a new +1 more button
      const dropZone = container.querySelector(".calendar__drop-zone")
      const newButton = document.createElement("button")
      newButton.className = "calendar__more"
      newButton.dataset.action = "calendar-expand#toggle"
      newButton.dataset.calendarExpandTarget = "toggle"
      newButton.innerHTML = `<span class="calendar__more-text">+1 more</span>`
      
      if (dropZone) {
        container.insertBefore(newButton, dropZone)
      } else {
        container.appendChild(newButton)
      }
    }
  }
  
  #incrementMoreCount(moreButton, delta) {
    const moreText = moreButton.querySelector(".calendar__more-text")
    if (!moreText) return
    
    const match = moreText.textContent.match(/\+(\d+)\s+more/)
    const currentCount = match ? parseInt(match[1]) : 0
    const newCount = currentCount + delta
    
    moreText.textContent = `+${newCount} more`
    moreButton.style.display = ""
  }
  
  #decrementMoreCount(moreButton) {
    const moreText = moreButton.querySelector(".calendar__more-text")
    if (!moreText) return
    
    const match = moreText.textContent.match(/\+(\d+)\s+more/)
    const currentCount = match ? parseInt(match[1]) : 0
    const newCount = Math.max(0, currentCount - 1)
    
    if (newCount === 0) {
      // Remove the button entirely
      moreButton.remove()
    } else {
      moreText.textContent = `+${newCount} more`
    }
  }
}
