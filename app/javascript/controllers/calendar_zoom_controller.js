import { Controller } from "@hotwired/stimulus"
import { isTouchDevice } from "helpers/touch_helpers"

/**
 * Calendar Zoom Controller
 * Enables pinch-to-zoom functionality on the calendar for mobile devices.
 * Maintains aspect ratio and scales all elements proportionally.
 */
export default class extends Controller {
  static values = {
    minScale: { type: Number, default: 0.5 },
    maxScale: { type: Number, default: 2.0 },
    initialScale: { type: Number, default: 1.0 }
  }

  connect() {
    if (!isTouchDevice()) return

    this.scale = this.initialScaleValue
    this.lastScale = 1
    this.initialDistance = 0
    this.isPinching = false

    this.#bindEvents()
  }

  disconnect() {
    this.#unbindEvents()
  }

  #bindEvents() {
    this.boundTouchStart = this.#handleTouchStart.bind(this)
    this.boundTouchMove = this.#handleTouchMove.bind(this)
    this.boundTouchEnd = this.#handleTouchEnd.bind(this)
    this.boundGestureStart = this.#handleGestureStart.bind(this)
    this.boundGestureChange = this.#handleGestureChange.bind(this)
    this.boundGestureEnd = this.#handleGestureEnd.bind(this)

    // Standard touch events for Android and other browsers
    this.element.addEventListener("touchstart", this.boundTouchStart, { passive: false })
    this.element.addEventListener("touchmove", this.boundTouchMove, { passive: false })
    this.element.addEventListener("touchend", this.boundTouchEnd, { passive: true })

    // Safari gesture events (more reliable on iOS)
    this.element.addEventListener("gesturestart", this.boundGestureStart, { passive: false })
    this.element.addEventListener("gesturechange", this.boundGestureChange, { passive: false })
    this.element.addEventListener("gestureend", this.boundGestureEnd, { passive: true })
  }

  #unbindEvents() {
    if (this.boundTouchStart) {
      this.element.removeEventListener("touchstart", this.boundTouchStart)
      this.element.removeEventListener("touchmove", this.boundTouchMove)
      this.element.removeEventListener("touchend", this.boundTouchEnd)
      this.element.removeEventListener("gesturestart", this.boundGestureStart)
      this.element.removeEventListener("gesturechange", this.boundGestureChange)
      this.element.removeEventListener("gestureend", this.boundGestureEnd)
    }
  }

  // ========================================
  // Standard Touch Events (Android, etc.)
  // ========================================

  #handleTouchStart(event) {
    if (event.touches.length === 2) {
      event.preventDefault()
      this.isPinching = true
      this.initialDistance = this.#getDistance(event.touches[0], event.touches[1])
      this.lastScale = this.scale
    }
  }

  #handleTouchMove(event) {
    if (!this.isPinching || event.touches.length !== 2) return

    event.preventDefault()

    const currentDistance = this.#getDistance(event.touches[0], event.touches[1])
    const scaleChange = currentDistance / this.initialDistance
    
    this.#applyScale(this.lastScale * scaleChange)
  }

  #handleTouchEnd(event) {
    if (event.touches.length < 2) {
      this.isPinching = false
    }
  }

  // ========================================
  // Safari Gesture Events (iOS)
  // ========================================

  #handleGestureStart(event) {
    event.preventDefault()
    this.lastScale = this.scale
  }

  #handleGestureChange(event) {
    event.preventDefault()
    this.#applyScale(this.lastScale * event.scale)
  }

  #handleGestureEnd(event) {
    // Scale is already applied
  }

  // ========================================
  // Helpers
  // ========================================

  #getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  #applyScale(newScale) {
    // Clamp scale to min/max values
    this.scale = Math.min(Math.max(newScale, this.minScaleValue), this.maxScaleValue)

    // Apply transform to the calendar main area
    const main = this.element.querySelector(".calendar__main")
    if (main) {
      main.style.transform = `scale(${this.scale})`
      main.style.transformOrigin = "top left"
      
      // Adjust the container width to account for scaling
      // This ensures scrolling still works properly
      const baseWidth = main.scrollWidth / this.scale
      main.style.minWidth = `${baseWidth * this.scale}px`
    }

    // Add visual indicator for current zoom level
    this.#updateZoomIndicator()
  }

  #updateZoomIndicator() {
    let indicator = this.element.querySelector(".calendar__zoom-indicator")
    
    if (!indicator) {
      indicator = document.createElement("div")
      indicator.className = "calendar__zoom-indicator"
      indicator.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        pointer-events: none;
        transition: opacity 0.3s ease;
      `
      this.element.appendChild(indicator)
    }

    indicator.textContent = `${Math.round(this.scale * 100)}%`
    indicator.style.opacity = "1"

    // Hide indicator after a delay
    clearTimeout(this.indicatorTimeout)
    this.indicatorTimeout = setTimeout(() => {
      indicator.style.opacity = "0"
    }, 1500)
  }

  // Double-tap to reset zoom
  resetZoom() {
    this.scale = this.initialScaleValue
    const main = this.element.querySelector(".calendar__main")
    if (main) {
      main.style.transform = ""
      main.style.transformOrigin = ""
      main.style.minWidth = ""
    }
    this.#updateZoomIndicator()
  }
}
