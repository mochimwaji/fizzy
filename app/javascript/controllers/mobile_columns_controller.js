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
    this.isNavigating = false

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
    if (event.touches.length !== 1 || this.isNavigating) return

    this.startX = event.touches[0].clientX
    this.startY = event.touches[0].clientY
    this.currentX = this.startX
    this.currentY = this.startY
    this.isSwiping = true
  }

  #handleTouchMove(event) {
    if (!this.isSwiping || event.touches.length !== 1 || this.isNavigating) return

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
    if (!this.isSwiping || this.isNavigating) return

    const deltaX = this.currentX - this.startX
    const direction = deltaX > 0 ? "right" : "left"
    
    this.#hideSwipeIndicator()

    // Check if swipe was significant enough
    if (Math.abs(deltaX) >= this.thresholdValue) {
      if (deltaX > 0 && this.hasPrevUrlValue) {
        // Swiped right - go to previous column
        this.#navigateWithFade(this.prevUrlValue, direction)
      } else if (deltaX < 0 && this.hasNextUrlValue) {
        // Swiped left - go to next column
        this.#navigateWithFade(this.nextUrlValue, direction)
      }
    }

    this.isSwiping = false
  }

  #showSwipeIndicator(deltaX) {
    // Visual feedback during swipe - subtle transform and opacity
    const progress = Math.min(Math.abs(deltaX) / this.thresholdValue, 1)
    const maxOffset = 30
    const offset = progress * maxOffset * Math.sign(deltaX)
    const opacity = 1 - (progress * 0.3)
    
    this.element.style.transform = `translateX(${offset}px)`
    this.element.style.opacity = opacity
    this.element.style.transition = "none"
  }

  #hideSwipeIndicator() {
    this.element.style.transform = ""
    this.element.style.opacity = ""
    this.element.style.transition = "transform 0.2s ease-out, opacity 0.2s ease-out"
  }

  #navigateWithFade(url, direction) {
    if (!url || this.isNavigating) return
    
    this.isNavigating = true
    
    // Apply fade out with directional slide
    const slideOffset = direction === "left" ? "-40px" : "40px"
    this.element.style.transition = "transform 0.2s ease-out, opacity 0.2s ease-out"
    this.element.style.transform = `translateX(${slideOffset})`
    this.element.style.opacity = "0"
    
    // Navigate after fade animation
    setTimeout(() => {
      Turbo.visit(url)
    }, 180)
  }

  // Action methods for button-based navigation
  prev() {
    if (this.hasPrevUrlValue && !this.isNavigating) {
      this.#navigateWithFade(this.prevUrlValue, "right")
    }
  }

  next() {
    if (this.hasNextUrlValue && !this.isNavigating) {
      this.#navigateWithFade(this.nextUrlValue, "left")
    }
  }
}
