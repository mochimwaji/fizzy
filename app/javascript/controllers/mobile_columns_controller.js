import { Controller } from "@hotwired/stimulus"
import { isTouchDevice } from "helpers/touch_helpers"

/**
 * Mobile Columns Controller
 * Enables swipe navigation between columns on mobile devices.
 * Provides prev/next navigation when viewing individual columns.
 */
export default class extends Controller {
  static values = {
    prevUrl: String,
    nextUrl: String,
    // Minimum distance to trigger navigation
    threshold: { type: Number, default: 80 },
    // Maximum vertical movement allowed during swipe
    maxVertical: { type: Number, default: 100 }
  }

  connect() {
    if (!isTouchDevice()) return

    this.startX = 0
    this.startY = 0
    this.currentX = 0
    this.currentY = 0
    this.isSwiping = false

    this.#bindEvents()
  }

  disconnect() {
    this.#unbindEvents()
  }

  #bindEvents() {
    this.boundTouchStart = this.#handleTouchStart.bind(this)
    this.boundTouchMove = this.#handleTouchMove.bind(this)
    this.boundTouchEnd = this.#handleTouchEnd.bind(this)

    this.element.addEventListener("touchstart", this.boundTouchStart, { passive: true })
    this.element.addEventListener("touchmove", this.boundTouchMove, { passive: false })
    this.element.addEventListener("touchend", this.boundTouchEnd, { passive: true })
  }

  #unbindEvents() {
    if (this.boundTouchStart) {
      this.element.removeEventListener("touchstart", this.boundTouchStart)
      this.element.removeEventListener("touchmove", this.boundTouchMove)
      this.element.removeEventListener("touchend", this.boundTouchEnd)
    }
  }

  #handleTouchStart(event) {
    if (event.touches.length !== 1) return

    this.startX = event.touches[0].clientX
    this.startY = event.touches[0].clientY
    this.currentX = this.startX
    this.currentY = this.startY
    this.isSwiping = true
  }

  #handleTouchMove(event) {
    if (!this.isSwiping || event.touches.length !== 1) return

    this.currentX = event.touches[0].clientX
    this.currentY = event.touches[0].clientY

    const deltaX = this.currentX - this.startX
    const deltaY = Math.abs(this.currentY - this.startY)

    // If too much vertical movement, cancel swipe
    if (deltaY > this.maxVerticalValue) {
      this.isSwiping = false
      return
    }

    // Prevent scrolling when swiping horizontally
    if (Math.abs(deltaX) > 10 && deltaY < Math.abs(deltaX)) {
      event.preventDefault()
      this.#showSwipeIndicator(deltaX)
    }
  }

  #handleTouchEnd() {
    if (!this.isSwiping) return

    const deltaX = this.currentX - this.startX
    
    this.#hideSwipeIndicator()

    // Check if swipe was significant enough
    if (Math.abs(deltaX) >= this.thresholdValue) {
      if (deltaX > 0 && this.hasPrevUrlValue) {
        // Swiped right - go to previous column
        this.#navigateTo(this.prevUrlValue)
      } else if (deltaX < 0 && this.hasNextUrlValue) {
        // Swiped left - go to next column
        this.#navigateTo(this.nextUrlValue)
      }
    }

    this.isSwiping = false
  }

  #showSwipeIndicator(deltaX) {
    // Simple visual feedback during swipe
    const maxOffset = 20
    const progress = Math.min(Math.abs(deltaX) / this.thresholdValue, 1)
    const offset = progress * maxOffset * Math.sign(deltaX)
    
    this.element.style.transform = `translateX(${offset}px)`
    this.element.style.transition = "none"
  }

  #hideSwipeIndicator() {
    this.element.style.transform = ""
    this.element.style.transition = "transform 0.15s ease-out"
  }

  #navigateTo(url) {
    // Navigate immediately without animation - Turbo handles the transition
    // Animation was causing jitter due to page replacement
    if (url) {
      Turbo.visit(url)
    }
  }

  // Action methods for button-based navigation
  prev() {
    if (this.hasPrevUrlValue) {
      this.#navigateTo(this.prevUrlValue)
    }
  }

  next() {
    if (this.hasNextUrlValue) {
      this.#navigateTo(this.nextUrlValue)
    }
  }
}
