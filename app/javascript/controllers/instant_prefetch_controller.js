import { Controller } from "@hotwired/stimulus"

/**
 * InstantPrefetchController
 * 
 * Preloads pages on touchstart/mousedown for near-instant navigation.
 * This loads pages before the user lifts their finger/mouse, so by the time
 * the click event fires, the page is often already cached.
 * 
 * Usage: Automatically applied to the document body
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
  }
  
  disconnect() {
    document.removeEventListener("touchstart", this.boundTouchStart, { capture: true })
    document.removeEventListener("mousedown", this.boundMouseDown, { capture: true })
  }
  
  #handleTouchStart(event) {
    const link = event.target.closest("a[href]")
    if (link) this.#prefetchLink(link)
  }
  
  #handleMouseDown(event) {
    // Only prefetch on left click
    if (event.button !== 0) return
    const link = event.target.closest("a[href]")
    if (link) this.#prefetchLink(link)
  }
  
  #prefetchLink(link) {
    const href = link.href
    
    // Skip if already prefetched
    if (this.prefetchedUrls.has(href)) return
    
    // Skip external links
    if (link.origin !== window.location.origin) return
    
    // Skip links with data-turbo="false"
    if (link.dataset.turbo === "false") return
    
    // Skip links that open in new tab/window
    if (link.target === "_blank") return
    
    // Skip anchor links
    if (link.hash && link.pathname === window.location.pathname) return
    
    // Skip links to current page
    if (href === window.location.href) return
    
    // Skip download links
    if (link.hasAttribute("download")) return
    
    // Mark as prefetched
    this.prefetchedUrls.add(href)
    
    // Use fetch to prefetch (Turbo will use cached response)
    // Set low priority to not compete with user-initiated requests
    fetch(href, {
      method: "GET",
      credentials: "same-origin",
      priority: "low",
      headers: {
        "Accept": "text/html, application/xhtml+xml",
        "X-Requested-With": "XMLHttpRequest",
        "Turbo-Prefetch": "true"
      }
    }).catch(() => {
      // Remove from set if failed so it can be retried
      this.prefetchedUrls.delete(href)
    })
  }
}
