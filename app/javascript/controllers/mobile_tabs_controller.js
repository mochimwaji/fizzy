import { Controller } from "@hotwired/stimulus"
import { isTouchDevice } from "helpers/touch_helpers"

/**
 * Mobile Tabs Controller
 * Manages the scrollable tab bar for column navigation on mobile.
 * Handles auto-scrolling to the active tab and drag-and-drop to tabs.
 */
export default class extends Controller {
  static targets = ["scroll", "tab"]
  static values = {
    currentIndex: Number
  }

  connect() {
    // Auto-scroll to center the current tab
    this.#scrollToCurrentTab()
    
    // Set up drag-and-drop listeners for tabs
    this.#setupDropTargets()
  }

  disconnect() {
    this.#cleanupDropTargets()
  }

  #scrollToCurrentTab() {
    const currentTab = this.tabTargets[this.currentIndexValue]
    if (!currentTab || !this.hasScrollTarget) return

    // Wait for layout to complete
    requestAnimationFrame(() => {
      const scrollContainer = this.scrollTarget
      const tabRect = currentTab.getBoundingClientRect()
      const containerRect = scrollContainer.getBoundingClientRect()
      
      // Calculate scroll position to center the tab
      const tabCenter = currentTab.offsetLeft + (currentTab.offsetWidth / 2)
      const containerCenter = scrollContainer.offsetWidth / 2
      const scrollPos = tabCenter - containerCenter

      scrollContainer.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: "instant" // Use instant on initial load
      })
    })
  }

  #setupDropTargets() {
    this.tabTargets.forEach(tab => {
      // Only make column tabs (not special columns) droppable
      if (tab.dataset.droppable === "true") {
        tab.addEventListener("dragover", this.#handleDragOver.bind(this))
        tab.addEventListener("dragenter", this.#handleDragEnter.bind(this))
        tab.addEventListener("dragleave", this.#handleDragLeave.bind(this))
        tab.addEventListener("drop", this.#handleDrop.bind(this))
      }
    })
  }

  #cleanupDropTargets() {
    this.tabTargets.forEach(tab => {
      tab.removeEventListener("dragover", this.#handleDragOver)
      tab.removeEventListener("dragenter", this.#handleDragEnter)
      tab.removeEventListener("dragleave", this.#handleDragLeave)
      tab.removeEventListener("drop", this.#handleDrop)
    })
  }

  #handleDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }

  #handleDragEnter(event) {
    event.preventDefault()
    event.currentTarget.classList.add("mobile-column-tabs__tab--drag-over")
  }

  #handleDragLeave(event) {
    event.currentTarget.classList.remove("mobile-column-tabs__tab--drag-over")
  }

  #handleDrop(event) {
    event.preventDefault()
    const tab = event.currentTarget
    tab.classList.remove("mobile-column-tabs__tab--drag-over")
    
    const columnId = tab.dataset.columnId
    
    // The drag item is stored in the drag-and-drop controller's state
    // We need to find the currently dragged card
    const draggedCard = document.querySelector(".drag-and-drop__dragged-item")
    if (!draggedCard) return
    
    const cardNumber = draggedCard.dataset.id
    
    if (cardNumber && columnId) {
      this.#moveCardToColumn(cardNumber, columnId)
    }
  }

  #moveCardToColumn(cardNumber, columnId) {
    // Build the URL for moving the card to the column
    // Use the current path to extract the account prefix
    const pathParts = window.location.pathname.split("/")
    // Find the account ID (first segment after empty string)
    const accountId = pathParts[1]
    const url = `/${accountId}/columns/cards/${cardNumber}/drops/columns?column_id=${columnId}`
    
    // Use fetch to submit the move request
    fetch(url, {
      method: "POST",
      headers: {
        "Accept": "text/vnd.turbo-stream.html",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
      }
    }).then(response => {
      if (response.ok) {
        // Reload the page to show the updated card positions
        Turbo.visit(window.location.href, { action: "replace" })
      }
    })
  }
}
