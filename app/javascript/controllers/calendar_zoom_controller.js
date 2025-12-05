import { Controller } from "@hotwired/stimulus"
import { isTouchDevice } from "helpers/touch_helpers"

/**
 * Calendar Zoom Controller
 * Enables pinch-to-zoom functionality on the calendar for mobile devices.
 * Maintains aspect ratio and scales all elements proportionally.
 * Persists zoom level across page navigations using sessionStorage.
 */
export default class extends Controller {
  static values = {
    minScale: { type: Number, default: 0.5 },
    maxScale: { type: Number, default: 2.0 },
    initialScale: { type: Number, default: 1.0 },
    // Sensitivity factor to slow down zoom (lower = slower)
    sensitivity: { type: Number, default: 0.4 }
  }

  // Storage key for persisting zoom level
  static STORAGE_KEY = "fizzy_calendar_zoom"

  connect() {
    if (!isTouchDevice()) return

    // Restore saved zoom level or use initial
    this.scale = this.#loadSavedScale()
    this.lastScale = this.scale
    this.initialDistance = 0
    this.isPinching = false

    this.#bindEvents()
    
    // Apply saved scale on connect
    if (this.scale !== 1) {
      this.#applyScale(this.scale)
    }
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
  // Persistence
  // ========================================

  #loadSavedScale() {
    try {
      const saved = sessionStorage.getItem(this.constructor.STORAGE_KEY)
      if (saved) {
        const scale = parseFloat(saved)
        if (!isNaN(scale) && scale >= this.minScaleValue && scale <= this.maxScaleValue) {
          return scale
        }
      }
    } catch (e) {
      // sessionStorage not available
    }
    return this.initialScaleValue
  }

  #saveScale() {
    try {
      sessionStorage.setItem(this.constructor.STORAGE_KEY, this.scale.toString())
    } catch (e) {
      // sessionStorage not available
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
    const rawScaleChange = currentDistance / this.initialDistance
    
    // Apply sensitivity to slow down the zoom
    // Convert scale change to a delta, apply sensitivity, then convert back
    const scaleDelta = (rawScaleChange - 1) * this.sensitivityValue
    const adjustedScaleChange = 1 + scaleDelta
    
    this.#applyScale(this.lastScale * adjustedScaleChange)
  }

  #handleTouchEnd(event) {
    if (event.touches.length < 2) {
      this.isPinching = false
      // Save scale when pinch ends
      this.#saveScale()
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
    
    // Apply sensitivity to slow down the zoom for Safari gestures too
    const rawScaleChange = event.scale
    const scaleDelta = (rawScaleChange - 1) * this.sensitivityValue
    const adjustedScaleChange = 1 + scaleDelta
    
    this.#applyScale(this.lastScale * adjustedScaleChange)
  }

  #handleGestureEnd(event) {
    // Save scale when gesture ends
    this.#saveScale()
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

    // Apply transform to the ENTIRE calendar (including sidebar)
    // This ensures month/year scales together with the rest
    this.element.style.transform = `scale(${this.scale})`
    this.element.style.transformOrigin = "top left"
    
    // Adjust the container size to account for scaling
    // This ensures the calendar takes up the correct space and scrolling works
    this.element.style.width = `${100 / this.scale}%`
    this.element.style.height = `${100 / this.scale}%`

    // Add visual indicator for current zoom level
    this.#updateZoomIndicator()
  }

  #updateZoomIndicator() {
    // Use a fixed position indicator outside the scaled element
    let indicator = document.getElementById("calendar-zoom-indicator")
    
    if (!indicator) {
      indicator = document.createElement("div")
      indicator.id = "calendar-zoom-indicator"
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
      document.body.appendChild(indicator)
    }

    indicator.textContent = `${Math.round(this.scale * 100)}%`
    indicator.style.opacity = "1"

    // Hide indicator after a delay
    clearTimeout(this.indicatorTimeout)
    this.indicatorTimeout = setTimeout(() => {
      indicator.style.opacity = "0"
    }, 1500)
  }

  // Double-tap to reset zoom (can be called from action)
  resetZoom() {
    this.scale = this.initialScaleValue
    this.element.style.transform = ""
    this.element.style.transformOrigin = ""
    this.element.style.width = ""
    this.element.style.height = ""
    this.#saveScale()
    this.#updateZoomIndicator()
  }
}
