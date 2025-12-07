import { Controller } from "@hotwired/stimulus"

/**
 * PageTransitionController
 *
 * Handles smooth page transitions by:
 * 1. Detecting navigation direction (forward/back) for slide animations
 * 2. Managing View Transitions API classes
 * 3. Adding visual feedback during navigation
 *
 * Works with CSS view-transitions.css for the actual animations.
 */
export default class extends Controller {
  static targets = ["main"]

  connect() {
    // Track the navigation history for direction detection
    this.navigationStack = JSON.parse(sessionStorage.getItem("navigationStack") || "[]")
    this.currentPath = window.location.pathname
  }

  // Called before Turbo visits a new page
  rememberPosition(event) {
    // Save current scroll position
    sessionStorage.setItem("scrollY", window.scrollY.toString())

    // Determine navigation direction based on URL hierarchy
    const targetUrl = new URL(event.detail.url)
    const currentPath = this.currentPath
    const targetPath = targetUrl.pathname

    // Detect if this is a "back" navigation (going up in URL hierarchy)
    // or "forward" navigation (going deeper)
    const direction = this.#determineDirection(currentPath, targetPath)

    // Set the direction class on the document for CSS transitions
    document.documentElement.setAttribute("data-nav-direction", direction)

    // Update navigation stack
    if (direction === "forward") {
      this.navigationStack.push(currentPath)
      sessionStorage.setItem("navigationStack", JSON.stringify(this.navigationStack))
    } else if (direction === "back") {
      this.navigationStack.pop()
      sessionStorage.setItem("navigationStack", JSON.stringify(this.navigationStack))
    }
  }

  // Called when Turbo starts rendering
  prepareRender(event) {
    // Add transition class to prevent flickering
    document.documentElement.classList.add("is-navigating")
  }

  // Called after Turbo finishes rendering
  finishRender(event) {
    // Remove transition class after the view transition completes
    // Use requestAnimationFrame to ensure we're in the next paint cycle
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("is-navigating")
        document.documentElement.removeAttribute("data-nav-direction")
      })
    })

    // Update current path
    this.currentPath = window.location.pathname
  }

  // Called when a popstate event occurs (browser back/forward)
  handlePopstate(event) {
    // Browser back/forward always gets the "back" transition
    document.documentElement.setAttribute("data-nav-direction", "back")
  }

  // Called when the page loads from cache (restoration visit)
  handleRestore(event) {
    // Restore navigation stack if available
    this.navigationStack = JSON.parse(sessionStorage.getItem("navigationStack") || "[]")
    this.currentPath = window.location.pathname

    // Restoration visits should be instant (no animation)
    document.documentElement.setAttribute("data-nav-direction", "restore")
  }

  // Determine navigation direction based on URL structure
  #determineDirection(fromPath, toPath) {
    // Normalize paths
    fromPath = fromPath.replace(/\/$/, "") || "/"
    toPath = toPath.replace(/\/$/, "") || "/"

    // Check if we're in the navigation stack (going back)
    if (this.navigationStack.includes(toPath)) {
      return "back"
    }

    // Count path segments
    const fromSegments = fromPath.split("/").filter(Boolean).length
    const toSegments = toPath.split("/").filter(Boolean).length

    // Going deeper = forward, going up = back
    if (toSegments > fromSegments) {
      return "forward"
    } else if (toSegments < fromSegments) {
      return "back"
    }

    // Same depth - check if target path starts with current path (drilling down)
    if (toPath.startsWith(fromPath)) {
      return "forward"
    }

    // Default to forward for lateral navigation
    return "forward"
  }
}
