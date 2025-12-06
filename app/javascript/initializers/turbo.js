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

// Prevent scroll restoration issues during view transitions
document.addEventListener("turbo:before-visit", (event) => {
  // Store scroll position before navigation
  sessionStorage.setItem("turbo-scroll-position", window.scrollY.toString())
})

// Handle scroll position after navigation
document.addEventListener("turbo:load", () => {
  // Reset scroll to top for new pages
  const isRestore = performance.getEntriesByType("navigation")[0]?.type === "back_forward"
  
  if (!isRestore) {
    // For forward navigation, scroll to top smoothly
    window.scrollTo({ top: 0, behavior: "instant" })
  }
})

// Smooth out frame loading transitions
document.addEventListener("turbo:before-fetch-request", (event) => {
  // Add loading state class for CSS transitions
  const frame = event.target.closest("turbo-frame")
  if (frame) {
    frame.classList.add("is-loading")
  }
})

document.addEventListener("turbo:before-fetch-response", (event) => {
  const frame = event.target.closest("turbo-frame")
  if (frame) {
    frame.classList.remove("is-loading")
  }
})
