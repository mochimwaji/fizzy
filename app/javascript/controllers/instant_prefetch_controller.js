import { Controller } from "@hotwired/stimulus"

/**
 * InstantPrefetchController
 * 
 * Aggressively preloads all internal links for near-instant navigation.
 * 
 * Strategy:
 * 1. On page load, prefetch all visible internal links (low priority)
 * 2. On touchstart/mousedown, prefetch immediately (high priority)
 * 
 * This trades initial bandwidth for snappy navigation throughout the app.
 */
export default class extends Controller {
  connect() {
    // Track prefetched URLs to avoid duplicate requests
    this.prefetchedUrls = new Set()
    
    // Bind event handlers
    this.boundTouchStart = this.#handleTouchStart.bind(this)
    this.boundMouseDown = this.#handleMouseDown.bind(this)
    
    // Use capture phase to get events before they bubble
    document.addEventListener("touchstart", this.boundTouchStart, { passive: true, capture: true })
    document.addEventListener("mousedown", this.boundMouseDown, { passive: true, capture: true })
    
    // Prefetch all visible links after page is idle
    this.#prefetchAllLinksWhenIdle()
  }
  
  disconnect() {
    document.removeEventListener("touchstart", this.boundTouchStart, { capture: true })
    document.removeEventListener("mousedown", this.boundMouseDown, { capture: true })
  }
  
  // Prefetch all internal links when browser is idle
  #prefetchAllLinksWhenIdle() {
    const prefetchAll = () => {
      // Get all internal links on the page
      const links = document.querySelectorAll("a[href]")
      
      // Prefetch each link with a small delay between requests
      let delay = 0
      const delayIncrement = 100 // 100ms between each prefetch
      
      links.forEach(link => {
        if (this.#shouldPrefetch(link)) {
          setTimeout(() => this.#prefetchUrl(link.href, "low"), delay)
          delay += delayIncrement
        }
      })
    }
    
    // Use requestIdleCallback if available, otherwise setTimeout
    if ("requestIdleCallback" in window) {
      requestIdleCallback(prefetchAll, { timeout: 2000 })
    } else {
      setTimeout(prefetchAll, 1000)
    }
  }
  
  #handleTouchStart(event) {
    const link = event.target.closest("a[href]")
    if (link && this.#shouldPrefetch(link)) {
      this.#prefetchUrl(link.href, "high")
    }
  }
  
  #handleMouseDown(event) {
    // Only prefetch on left click
    if (event.button !== 0) return
    const link = event.target.closest("a[href]")
    if (link && this.#shouldPrefetch(link)) {
      this.#prefetchUrl(link.href, "high")
    }
  }
  
  #shouldPrefetch(link) {
    const href = link.href
    
    // Skip if already prefetched
    if (this.prefetchedUrls.has(href)) return false
    
    // Skip external links
    try {
      const url = new URL(href)
      if (url.origin !== window.location.origin) return false
    } catch {
      return false
    }
    
    // Skip links with data-turbo="false"
    if (link.dataset.turbo === "false") return false
    
    // Skip links that open in new tab/window
    if (link.target === "_blank") return false
    
    // Skip anchor links on same page
    if (link.hash && link.pathname === window.location.pathname) return false
    
    // Skip links to current page
    if (href === window.location.href) return false
    
    // Skip download links
    if (link.hasAttribute("download")) return false
    
    // Skip non-GET actions (forms)
    if (link.dataset.turboMethod) return false
    
    return true
  }
  
  #prefetchUrl(href, priority = "low") {
    // Mark as prefetched immediately to prevent duplicates
    this.prefetchedUrls.add(href)
    
    // Use fetch to prefetch (browser will cache the response)
    fetch(href, {
      method: "GET",
      credentials: "same-origin",
      priority: priority,
      headers: {
        "Accept": "text/html, application/xhtml+xml",
        "Purpose": "prefetch",
        "Sec-Purpose": "prefetch"
      }
    }).catch(() => {
      // Remove from set if failed so it can be retried
      this.prefetchedUrls.delete(href)
    })
  }
}
