import { Controller } from "@hotwired/stimulus"

/**
 * SPA Shell Controller
 * 
 * Manages the single-page app shell behavior:
 * 1. Shows skeleton placeholders instantly when navigating
 * 2. Hides skeleton when real content loads
 * 3. Handles URL-based skeleton selection
 */
export default class extends Controller {
    static targets = ["mainContent"]

    connect() {
        this.isNavigating = false
    }

    // Called when turbo starts visiting a new URL
    showSkeletonOnVisit(event) {
        const url = event.detail?.url
        if (!url) return

        this.#showSkeletonForUrl(url)
    }

    // Called before turbo-frame renders
    showSkeleton(event) {
        const frame = event.target
        if (frame.id !== "main-content") return

        // Already showing skeleton or navigating
        if (this.isNavigating) return

        this.isNavigating = true
        this.#showSkeletonForUrl(window.location.href)
    }

    // Called after turbo-frame renders
    hideSkeleton(event) {
        const frame = event.target
        if (frame.id !== "main-content") return

        this.isNavigating = false
        this.#hideSkeleton()
    }

    // Show the appropriate skeleton based on URL
    #showSkeletonForUrl(url) {
        const skeletonType = this.#getSkeletonType(url)
        const template = document.getElementById(`skeleton-${skeletonType}`)

        if (!template) return

        const mainContent = document.getElementById("main-content")
        if (!mainContent) return

        // Clone skeleton and show it as fixed overlay
        const skeleton = template.content.cloneNode(true)
        const skeletonContainer = document.createElement("div")
        skeletonContainer.id = "active-skeleton"
        skeletonContainer.className = "skeleton-container skeleton-container--active"
        skeletonContainer.appendChild(skeleton)

        // Insert skeleton as overlay (fixed positioned in CSS)
        document.body.appendChild(skeletonContainer)
    }

    #hideSkeleton() {
        const skeleton = document.getElementById("active-skeleton")
        if (skeleton) {
            skeleton.remove()
        }
    }

    // Determine skeleton type from URL pattern
    #getSkeletonType(url) {
        try {
            const path = new URL(url).pathname

            // Match URL patterns to skeleton types
            if (path === "/" || path.match(/^\/[^\/]+\/?$/)) {
                return "events" // Home/activity page
            }
            if (path.includes("/calendar")) {
                return "calendar"
            }
            if (path.includes("/settings") || path.includes("/edit")) {
                return "settings"
            }
            if (path.match(/\/boards\/[^\/]+$/)) {
                return "board"
            }
            if (path.match(/\/cards\/\d+/)) {
                return "card"
            }

            return "default"
        } catch {
            return "default"
        }
    }
}
