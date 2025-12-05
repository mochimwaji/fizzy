import { Controller } from "@hotwired/stimulus"
import { isTouchDevice } from "helpers/touch_helpers"

/**
 * Mobile Board Controller
 * Manages expandable category rows on the mobile board view.
 * Categories can be clicked to expand/collapse, showing cards inline.
 * Only one category can be open at a time.
 * Cards can be dragged from one category to another.
 */
export default class extends Controller {
  static targets = ["category", "header", "cardList"]
  static values = {
    boardId: String,
    accountId: String
  }

  connect() {
    // Store reference to currently expanded category
    this.expandedCategory = null
    
    // Restore any previously expanded state from localStorage
    this.#restoreState()
    
    // Listen for drag events to highlight drop targets
    this.#bindDragHighlighting()
  }

  disconnect() {
    this.#unbindDragHighlighting()
  }

  /**
   * Toggle a category open/closed
   * If another category is open, close it first with animation
   */
  toggle(event) {
    event.preventDefault()
    event.stopPropagation()
    
    const header = event.currentTarget
    const category = header.closest("[data-mobile-board-target='category']")
    
    if (!category) return
    
    const isExpanded = category.classList.contains("mobile-board__category--expanded")
    
    if (isExpanded) {
      // Close this category
      this.#collapseCategory(category)
    } else {
      // Close any other open category, then open this one
      if (this.expandedCategory && this.expandedCategory !== category) {
        this.#collapseCategory(this.expandedCategory, () => {
          this.#expandCategory(category)
        })
      } else {
        this.#expandCategory(category)
      }
    }
  }

  /**
   * Expand a category with smooth animation
   */
  #expandCategory(category) {
    const cardList = category.querySelector("[data-mobile-board-target='cardList']")
    const header = category.querySelector("[data-mobile-board-target='header']")
    
    if (!cardList) return
    
    // Get the natural height of the content
    cardList.style.height = "auto"
    const naturalHeight = cardList.scrollHeight
    cardList.style.height = "0"
    
    // Force reflow
    cardList.offsetHeight
    
    // Animate to natural height
    cardList.style.transition = "height 0.3s ease-out, opacity 0.3s ease-out"
    cardList.style.height = `${naturalHeight}px`
    cardList.style.opacity = "1"
    
    // Update state
    category.classList.add("mobile-board__category--expanded")
    header.setAttribute("aria-expanded", "true")
    this.expandedCategory = category
    
    // After animation completes, set height to auto for dynamic content
    setTimeout(() => {
      cardList.style.height = "auto"
      cardList.style.transition = ""
    }, 300)
    
    // Save state
    this.#saveState(category)
  }

  /**
   * Collapse a category with smooth animation
   */
  #collapseCategory(category, callback) {
    const cardList = category.querySelector("[data-mobile-board-target='cardList']")
    const header = category.querySelector("[data-mobile-board-target='header']")
    
    if (!cardList) {
      if (callback) callback()
      return
    }
    
    // Get current height and set it explicitly for animation
    const currentHeight = cardList.scrollHeight
    cardList.style.height = `${currentHeight}px`
    cardList.style.transition = ""
    
    // Force reflow
    cardList.offsetHeight
    
    // Animate to 0
    cardList.style.transition = "height 0.3s ease-out, opacity 0.3s ease-out"
    cardList.style.height = "0"
    cardList.style.opacity = "0"
    
    // Update state
    category.classList.remove("mobile-board__category--expanded")
    header.setAttribute("aria-expanded", "false")
    
    if (this.expandedCategory === category) {
      this.expandedCategory = null
    }
    
    // Clear saved state
    this.#clearState()
    
    // Call callback after animation
    if (callback) {
      setTimeout(callback, 300)
    }
  }

  /**
   * Save the expanded category to localStorage
   */
  #saveState(category) {
    const key = `mobile-board-${this.boardIdValue}-expanded`
    const categoryId = category.dataset.categoryId
    const categoryType = category.dataset.categoryType
    localStorage.setItem(key, JSON.stringify({ categoryId, categoryType }))
  }

  /**
   * Clear the saved state
   */
  #clearState() {
    const key = `mobile-board-${this.boardIdValue}-expanded`
    localStorage.removeItem(key)
  }

  /**
   * Restore the expanded state from localStorage
   */
  #restoreState() {
    const key = `mobile-board-${this.boardIdValue}-expanded`
    const saved = localStorage.getItem(key)
    
    if (!saved) return
    
    try {
      const { categoryId, categoryType } = JSON.parse(saved)
      const category = this.categoryTargets.find(c => 
        c.dataset.categoryId === categoryId && c.dataset.categoryType === categoryType
      )
      
      if (category) {
        // Expand without animation on restore
        const cardList = category.querySelector("[data-mobile-board-target='cardList']")
        const header = category.querySelector("[data-mobile-board-target='header']")
        
        if (cardList) {
          cardList.style.height = "auto"
          cardList.style.opacity = "1"
        }
        
        category.classList.add("mobile-board__category--expanded")
        header?.setAttribute("aria-expanded", "true")
        this.expandedCategory = category
      }
    } catch (e) {
      // Invalid saved state, clear it
      localStorage.removeItem(key)
    }
  }

  /**
   * Bind drag event listeners to highlight drop targets
   */
  #bindDragHighlighting() {
    this.boundDragEnter = this.#handleDragEnter.bind(this)
    this.boundDragLeave = this.#handleDragLeave.bind(this)
    this.boundDragEnd = this.#handleDragEnd.bind(this)
    
    this.categoryTargets.forEach(category => {
      category.addEventListener("dragenter", this.boundDragEnter)
      category.addEventListener("dragleave", this.boundDragLeave)
    })
    
    // Also listen for drag end to clean up all highlights
    document.addEventListener("dragend", this.boundDragEnd)
    this.element.addEventListener("drag-end", this.boundDragEnd)
  }

  #unbindDragHighlighting() {
    this.categoryTargets.forEach(category => {
      category.removeEventListener("dragenter", this.boundDragEnter)
      category.removeEventListener("dragleave", this.boundDragLeave)
    })
    
    document.removeEventListener("dragend", this.boundDragEnd)
    this.element.removeEventListener("drag-end", this.boundDragEnd)
  }

  #handleDragEnter(event) {
    const category = event.currentTarget
    // Only highlight collapsed categories or the header area of expanded ones
    if (!category.classList.contains("mobile-board__category--expanded") ||
        event.target.closest(".mobile-board__category-header")) {
      category.classList.add("mobile-board__category--drag-over")
    }
  }

  #handleDragLeave(event) {
    const category = event.currentTarget
    // Check if we're actually leaving the category
    const relatedTarget = event.relatedTarget
    if (relatedTarget && category.contains(relatedTarget)) return
    
    category.classList.remove("mobile-board__category--drag-over")
  }

  #handleDragEnd() {
    // Clear all drag-over highlights
    this.categoryTargets.forEach(category => {
      category.classList.remove("mobile-board__category--drag-over")
    })
  }
}
