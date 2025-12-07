import { Turbo } from "@hotwired/turbo-rails"

// Configure Turbo for smoother mobile navigation
document.addEventListener("DOMContentLoaded", () => {
  // Disable the progress bar entirely - we use view transitions instead
  // Setting a very high delay effectively disables it
  Turbo.setProgressBarDelay(99999)

  // Enable View Transitions support if available
  if (document.startViewTransition) {
    // Turbo 8+ has native view transitions support
    // We just need to make sure it's enabled
    document.documentElement.classList.add("turbo-view-transitions")
  }
})

// Wrap Turbo renders in the View Transitions API when available.
// This keeps document navigations smooth and avoids flash/flicker when swapping bodies.
document.addEventListener("turbo:before-render", (event) => {
  if (!document.startViewTransition) return

  const target = event.target
  if (target instanceof Element && target.tagName === "TURBO-FRAME") return
  if (event.detail.renderOptions?.preview) return

  const originalRender = event.detail.render

  event.detail.render = (currentElement, newElement) => {
    const transition = document.startViewTransition(() => originalRender(currentElement, newElement))
    // Avoid unhandled rejections if the transition is interrupted
    transition.finished.catch(() => { })
    return transition.finished
  }
})

// Handle scroll position after navigation
document.addEventListener("turbo:load", () => {
  // Reset scroll to top for new pages
  const isRestore = performance.getEntriesByType("navigation")[0]?.type === "back_forward"

  if (!isRestore) {
    // For forward navigation, scroll to top instantly
    window.scrollTo({ top: 0, behavior: "instant" })
  }
})

