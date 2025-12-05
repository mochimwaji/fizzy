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
      // All tabs are droppable
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
    
    const columnType = tab.dataset.columnType
    const columnId = tab.dataset.columnId
    
    // The drag item is stored in the drag-and-drop controller's state
    // We need to find the currently dragged card
    const draggedCard = document.querySelector(".drag-and-drop__dragged-item")
    if (!draggedCard) return
    
    const cardNumber = draggedCard.dataset.id
    
    if (cardNumber) {
      this.#moveCardToColumn(cardNumber, columnType, columnId)
    }
  }

  #moveCardToColumn(cardNumber, columnType, columnId) {
    // Build the URL for moving the card based on column type
    const pathParts = window.location.pathname.split("/")
    const accountId = pathParts[1]
    
    let url
    switch (columnType) {
      case "not_now":
        // POST /columns/cards/:card_id/drops/not_now
        url = `/${accountId}/columns/cards/${cardNumber}/drops/not_now`
        break
      case "stream":
        // POST /columns/cards/:card_id/drops/stream
        url = `/${accountId}/columns/cards/${cardNumber}/drops/stream`
        break
      case "closed":
        // POST /columns/cards/:card_id/drops/closure
        url = `/${accountId}/columns/cards/${cardNumber}/drops/closure`
        break
      case "column":
        // POST /columns/cards/:card_id/drops/column?column_id=:column_id
        url = `/${accountId}/columns/cards/${cardNumber}/drops/column?column_id=${columnId}`
        break
      default:
        console.error("Unknown column type for move:", columnType)
        return
    }
    
    // Use fetch to submit the move request
    fetch(url, {
      method: "POST",
      headers: {
        "Accept": "text/vnd.turbo-stream.html",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
      }
    }).then(response => {
      if (response.ok) {
        // Force full page reload to show the updated card positions
        window.location.reload()
      }
    })
  }
}
