import { Controller } from "@hotwired/stimulus"
import { post } from "@rails/request.js"
import { nextFrame } from "helpers/timing_helpers"
import {
  isTouchDevice,
  getTouchPosition,
  exceedsDragThreshold,
  hapticFeedback,
  createDragPreview,
  moveDragPreview,
  removeDragPreview,
  getElementAtTouch,
  preventTouchDefault,
  preventContextMenu,
  autoScrollNearEdge,
  LONG_PRESS_DURATION
} from "helpers/touch_helpers"

export default class extends Controller {
  static targets = [ "item", "container" ]
  static classes = [ "draggedItem", "hoverContainer" ]

  connect() {
    // Bind touch handlers for mobile support
    if (isTouchDevice()) {
      this.#bindTouchEvents()
      // Prevent context menu on draggable items
      this.itemTargets.forEach(item => preventContextMenu(item))
    }
  }

  disconnect() {
    this.#cleanupTouch()
    if (isTouchDevice()) {
      this.#unbindTouchEvents()
    }
  }
  
  // Called when new item targets are added (e.g., via Turbo)
  itemTargetConnected(item) {
    if (isTouchDevice()) {
      preventContextMenu(item)
    }
  }

  // ========================================
  // Desktop Drag and Drop (HTML5 API)
  // ========================================

  async dragStart(event) {
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.dropEffect = "move"
    event.dataTransfer.setData("37ui/move", event.target)

    await nextFrame()
    this.dragItem = this.#itemContaining(event.target)
    this.sourceContainer = this.#containerContaining(this.dragItem)
    this.dragItem.classList.add(this.draggedItemClass)
  }

  dragOver(event) {
    event.preventDefault()
    const container = this.#containerContaining(event.target)
    this.#clearContainerHoverClasses()

    if (!container) { return }

    if (container !== this.sourceContainer) {
      container.classList.add(this.hoverContainerClass)
    }
  }

  async drop(event) {
    const container = this.#containerContaining(event.target)

    if (!container || container === this.sourceContainer) { return }

    this.wasDropped = true
    this.#decreaseCounter(this.sourceContainer)
    const sourceContainer = this.sourceContainer
    await this.#submitDropRequest(this.dragItem, container)
    this.#reloadSourceFrame(sourceContainer);
  }

  dragEnd() {
    this.dragItem.classList.remove(this.draggedItemClass)
    this.#clearContainerHoverClasses()

    if (this.wasDropped) {
      this.dragItem.remove()
    }

    this.sourceContainer = null
    this.dragItem = null
    this.wasDropped = false
  }

  // ========================================
  // Touch Drag and Drop (Mobile)
  // ========================================

  #bindTouchEvents() {
    this.boundTouchStart = this.#handleTouchStart.bind(this)
    this.boundTouchMove = this.#handleTouchMove.bind(this)
    this.boundTouchEnd = this.#handleTouchEnd.bind(this)
    this.boundTouchCancel = this.#handleTouchCancel.bind(this)

    this.element.addEventListener("touchstart", this.boundTouchStart, { passive: false })
    this.element.addEventListener("touchmove", this.boundTouchMove, { passive: false })
    this.element.addEventListener("touchend", this.boundTouchEnd, { passive: false })
    this.element.addEventListener("touchcancel", this.boundTouchCancel, { passive: false })
  }

  #unbindTouchEvents() {
    if (this.boundTouchStart) {
      this.element.removeEventListener("touchstart", this.boundTouchStart)
      this.element.removeEventListener("touchmove", this.boundTouchMove)
      this.element.removeEventListener("touchend", this.boundTouchEnd)
      this.element.removeEventListener("touchcancel", this.boundTouchCancel)
    }
  }

  #handleTouchStart(event) {
    const item = this.#itemContaining(event.target)
    if (!item) return

    const position = getTouchPosition(event)
    if (!position) return

    // Store initial touch data
    this.touchStartPosition = position
    this.touchCurrentPosition = position
    this.potentialDragItem = item
    this.isDragging = false

    // Calculate offset from touch point to item's top-left
    const rect = item.getBoundingClientRect()
    this.touchOffset = {
      x: position.x - rect.left,
      y: position.y - rect.top
    }

    // Add preparing-to-drag visual feedback immediately
    item.classList.add("drag-and-drop__preparing")
    
    // Dispatch event to notify mobile-columns controller that we might be dragging
    this.element.dispatchEvent(new CustomEvent("drag-prepare-start", { bubbles: true }))

    // Start long-press timer to initiate drag
    this.longPressTimer = setTimeout(() => {
      this.#startTouchDrag(item, position)
    }, LONG_PRESS_DURATION)
  }

  #handleTouchMove(event) {
    const position = getTouchPosition(event)
    if (!position) return

    this.touchCurrentPosition = position

    // If we haven't started dragging yet
    if (!this.isDragging) {
      // Check if moved too much before long-press completed (user is scrolling)
      if (this.longPressTimer && exceedsDragThreshold(this.touchStartPosition, position)) {
        this.#cancelLongPress()
        return
      }
      return
    }

    // We're actively dragging
    preventTouchDefault(event)

    // Move the preview
    moveDragPreview(this.dragPreview, position, this.touchOffset)

    // Find container under touch point
    const elementUnder = getElementAtTouch(position, this.dragPreview)
    const container = this.#containerContaining(elementUnder)
    
    // Also check for mobile tab drop targets
    const tab = this.#findTabUnderTouch(elementUnder)
    
    // Check for mobile board category drop targets
    const category = this.#findCategoryUnderTouch(elementUnder)

    this.#clearContainerHoverClasses()
    this.#clearTabHoverClasses()
    this.#clearCategoryHoverClasses()

    if (tab) {
      // Prioritize tab if found
      tab.classList.add("mobile-column-tabs__tab--drag-over")
      this.currentDropTarget = null
      this.currentTabTarget = tab
    } else if (category && category !== this.sourceContainer) {
      // Mobile board category highlighting
      category.classList.add("mobile-board__category--drag-over")
      this.currentDropTarget = category
      this.currentTabTarget = null
    } else if (container && container !== this.sourceContainer) {
      container.classList.add(this.hoverContainerClass)
      this.currentDropTarget = container
      this.currentTabTarget = null
    } else {
      this.currentDropTarget = null
      this.currentTabTarget = null
    }

    // Auto-scroll if near container edges
    if (this.sourceContainer) {
      autoScrollNearEdge(this.sourceContainer.closest(".cards__list, .mobile-card-columns, .mobile-board"), position)
    }
  }

  #handleTouchEnd(event) {
    this.#cancelLongPress()

    if (!this.isDragging) {
      this.#cleanupTouch()
      return
    }

    preventTouchDefault(event)

    // Check if we have a tab drop target (mobile tabs)
    if (this.currentTabTarget) {
      this.wasDropped = true
      hapticFeedback("success")
      this.#decreaseCounter(this.sourceContainer)
      this.#submitTabDropRequest(this.dragItem, this.currentTabTarget)
    }
    // Check if we have a valid container drop target
    else if (this.currentDropTarget && this.currentDropTarget !== this.sourceContainer) {
      this.wasDropped = true
      hapticFeedback("success")
      this.#decreaseCounter(this.sourceContainer)
      const sourceContainer = this.sourceContainer
      this.#submitDropRequest(this.dragItem, this.currentDropTarget)
      this.#reloadSourceFrame(sourceContainer)
    }

    this.#endTouchDrag()
  }

  #handleTouchCancel(event) {
    this.#cancelLongPress()
    this.#endTouchDrag()
  }

  #startTouchDrag(item, position) {
    this.isDragging = true
    this.dragItem = item
    this.sourceContainer = this.#containerContaining(item)

    // Remove preparing class, add dragging class
    item.classList.remove("drag-and-drop__preparing")
    
    // Dispatch event to notify that we're now actively dragging
    this.element.dispatchEvent(new CustomEvent("drag-start", { bubbles: true }))

    // Haptic feedback for drag start
    hapticFeedback("medium")

    // Create floating preview
    this.dragPreview = createDragPreview(item, {
      opacity: "0.95",
      transform: "scale(1.01) rotate(0.5deg)"
    })

    // Style the original item
    item.classList.add(this.draggedItemClass)
    item.style.opacity = "0.3"

    // Position preview at current touch
    moveDragPreview(this.dragPreview, position, this.touchOffset)
  }

  #endTouchDrag() {
    // Dispatch event to notify that dragging has ended
    this.element.dispatchEvent(new CustomEvent("drag-end", { bubbles: true }))
    
    if (this.dragItem) {
      this.dragItem.classList.remove(this.draggedItemClass)
      this.dragItem.classList.remove("drag-and-drop__preparing")
      this.dragItem.style.opacity = ""

      if (this.wasDropped) {
        this.dragItem.remove()
      }
    }

    this.#clearContainerHoverClasses()
    this.#clearTabHoverClasses()
    this.#clearCategoryHoverClasses()
    removeDragPreview(this.dragPreview)
    this.#cleanupTouch()
  }

  #cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    
    // Remove preparing class from potential drag item
    if (this.potentialDragItem) {
      this.potentialDragItem.classList.remove("drag-and-drop__preparing")
    }
    
    // Notify that drag preparation was cancelled
    this.element.dispatchEvent(new CustomEvent("drag-prepare-end", { bubbles: true }))
  }

  #cleanupTouch() {
    this.#cancelLongPress()
    this.touchStartPosition = null
    this.touchCurrentPosition = null
    this.potentialDragItem = null
    this.isDragging = false
    this.dragPreview = null
    this.currentDropTarget = null
    this.currentTabTarget = null
    this.touchOffset = null
    this.sourceContainer = null
    this.dragItem = null
    this.wasDropped = false
  }

  // ========================================
  // Shared Helpers
  // ========================================

  #itemContaining(element) {
    return this.itemTargets.find(item => item.contains(element) || item === element)
  }

  #containerContaining(element) {
    if (!element) return null
    return this.containerTargets.find(container => container.contains(element) || container === element)
  }

  #clearContainerHoverClasses() {
    this.containerTargets.forEach(container => container.classList.remove(this.hoverContainerClass))
  }

  async #submitDropRequest(item, container) {
    const body = new FormData()
    const id = item.dataset.id
    const url = container.dataset.dragAndDropUrl.replaceAll("__id__", id)

    return post(url, { body, headers: { Accept: "text/vnd.turbo-stream.html" } })
  }

  #reloadSourceFrame(sourceContainer) {
    const frame = sourceContainer.querySelector("[data-drag-and-drop-refresh]")
    if (frame) frame.reload()
  }

  #decreaseCounter(sourceContainer) {
    const counterElement = sourceContainer.querySelector("[data-drag-and-drop-counter]")
    if (counterElement) {
      const currentValue = counterElement.textContent.trim()

      if (!/^\d+$/.test(currentValue)) return

      const count = parseInt(currentValue)
      if (count > 0) {
        counterElement.textContent = count - 1
      }
    }
  }

  // ========================================
  // Tab Drop Helpers (Mobile)
  // ========================================

  #findTabAtPoint(x, y) {
    const elements = document.elementsFromPoint(x, y)
    return elements.find(el => 
      el.classList.contains("mobile-column-tabs__tab") && 
      el.dataset.droppable === "true"
    )
  }

  #findTabUnderTouch(element) {
    if (!element) return null
    
    // Check if element itself is a tab
    if (element.classList?.contains("mobile-column-tabs__tab") && 
        element.dataset.droppable === "true") {
      return element
    }
    
    // Check parent elements
    return element.closest?.(".mobile-column-tabs__tab[data-droppable='true']")
  }

  #clearTabHoverClasses() {
    const tabs = document.querySelectorAll(".mobile-column-tabs__tab--drag-over")
    tabs.forEach(tab => tab.classList.remove("mobile-column-tabs__tab--drag-over"))
  }

  #findCategoryUnderTouch(element) {
    if (!element) return null
    
    // Check if element itself is a category
    if (element.classList?.contains("mobile-board__category")) {
      return element
    }
    
    // Check parent elements
    return element.closest?.(".mobile-board__category")
  }

  #clearCategoryHoverClasses() {
    const categories = document.querySelectorAll(".mobile-board__category--drag-over")
    categories.forEach(cat => cat.classList.remove("mobile-board__category--drag-over"))
  }

  async #submitTabDropRequest(item, tab) {
    const cardNumber = item.dataset.id
    const columnType = tab.dataset.columnType
    const columnId = tab.dataset.columnId
    const accountId = tab.dataset.accountId
    
    let url
    if (columnType === "not_now") {
      // POST /cards/:card_id/not_now
      url = `/${accountId}/cards/${cardNumber}/not_now`
    } else if (columnType === "stream") {
      // POST /columns/cards/:card_id/drops/stream
      url = `/${accountId}/columns/cards/${cardNumber}/drops/stream`
    } else if (columnType === "closed") {
      // POST /cards/:card_id/closure
      url = `/${accountId}/cards/${cardNumber}/closure`
    } else if (columnType === "column" && columnId) {
      // POST /columns/cards/:card_id/drops/column?column_id=:column_id
      url = `/${accountId}/columns/cards/${cardNumber}/drops/column?column_id=${columnId}`
    } else {
      console.error("Unknown column type for drop:", columnType)
      return
    }
    
    const response = await post(url, { 
      body: new FormData(), 
      headers: { Accept: "text/vnd.turbo-stream.html" } 
    })
    
    if (response.ok) {
      // Reload the page to show the updated card positions
      Turbo.visit(window.location.href, { action: "replace" })
    }
  }
}
