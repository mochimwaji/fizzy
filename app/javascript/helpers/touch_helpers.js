// Touch helpers for mobile drag-and-drop support

// Threshold in pixels before a touch is considered a drag vs a tap
export const DRAG_THRESHOLD = 10

// Duration in ms for long-press to initiate drag
export const LONG_PRESS_DURATION = 300

// Check if the device supports touch
export function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0
}

// Check if we're in standalone PWA mode
export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
         window.navigator.standalone === true
}

// Prevent browser context menu on long-press (for draggable elements)
export function preventContextMenu(element) {
  // Prevent contextmenu event
  element.addEventListener("contextmenu", (e) => {
    e.preventDefault()
    return false
  }, { passive: false })
  
  // Apply CSS to prevent touch callout (iOS Safari)
  element.style.webkitTouchCallout = "none"
  element.style.webkitUserSelect = "none"
  element.style.userSelect = "none"
}

// Get touch position from event
export function getTouchPosition(event) {
  const touch = event.touches?.[0] || event.changedTouches?.[0]
  if (!touch) return null
  
  return {
    x: touch.clientX,
    y: touch.clientY,
    pageX: touch.pageX,
    pageY: touch.pageY
  }
}

// Calculate distance between two points
export function getDistance(point1, point2) {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Check if movement exceeds drag threshold
export function exceedsDragThreshold(startPos, currentPos) {
  return getDistance(startPos, currentPos) > DRAG_THRESHOLD
}

// Trigger haptic feedback if available
export function hapticFeedback(type = "light") {
  if (!navigator.vibrate) return
  
  switch (type) {
    case "light":
      navigator.vibrate(10)
      break
    case "medium":
      navigator.vibrate(20)
      break
    case "heavy":
      navigator.vibrate([30, 10, 30])
      break
    case "success":
      navigator.vibrate([10, 50, 20])
      break
    case "error":
      navigator.vibrate([50, 30, 50, 30, 50])
      break
  }
}

// Create a drag preview element
export function createDragPreview(element, options = {}) {
  const rect = element.getBoundingClientRect()
  const preview = element.cloneNode(true)
  
  // Apply styles for floating preview
  Object.assign(preview.style, {
    position: "fixed",
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: "0",
    zIndex: "10000",
    pointerEvents: "none",
    opacity: options.opacity || "0.9",
    transform: options.transform || "scale(1.05) rotate(2deg)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    ...options.styles
  })
  
  preview.classList.add("touch-drag-preview")
  preview.removeAttribute("id")
  preview.removeAttribute("data-controller")
  
  document.body.appendChild(preview)
  
  return preview
}

// Move drag preview to follow touch
export function moveDragPreview(preview, position, offset = { x: 0, y: 0 }) {
  if (!preview) return
  
  const x = position.x - offset.x
  const y = position.y - offset.y
  
  preview.style.left = `${x}px`
  preview.style.top = `${y}px`
}

// Remove drag preview
export function removeDragPreview(preview) {
  if (preview && preview.parentNode) {
    preview.remove()
  }
}

// Get element at touch position (excluding the preview)
export function getElementAtTouch(position, excludeElement) {
  if (!position) return null
  
  // Temporarily hide the preview to get element underneath
  if (excludeElement) {
    excludeElement.style.display = "none"
  }
  
  const element = document.elementFromPoint(position.x, position.y)
  
  if (excludeElement) {
    excludeElement.style.display = ""
  }
  
  return element
}

// Prevent default touch behaviors (scrolling) during drag
export function preventTouchDefault(event) {
  if (event.cancelable) {
    event.preventDefault()
  }
}

// Check if element is scrollable
export function isScrollable(element) {
  if (!element) return false
  
  const style = window.getComputedStyle(element)
  const overflowY = style.overflowY
  const overflowX = style.overflowX
  
  return (
    (overflowY === "auto" || overflowY === "scroll" || overflowX === "auto" || overflowX === "scroll") &&
    (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth)
  )
}

// Auto-scroll container when dragging near edges
export function autoScrollNearEdge(container, position, options = {}) {
  if (!container || !position) return null
  
  const rect = container.getBoundingClientRect()
  const edgeSize = options.edgeSize || 50
  const maxSpeed = options.maxSpeed || 15
  
  let scrollX = 0
  let scrollY = 0
  
  // Top edge
  if (position.y < rect.top + edgeSize) {
    const distance = rect.top + edgeSize - position.y
    scrollY = -Math.min(distance / edgeSize * maxSpeed, maxSpeed)
  }
  // Bottom edge
  else if (position.y > rect.bottom - edgeSize) {
    const distance = position.y - (rect.bottom - edgeSize)
    scrollY = Math.min(distance / edgeSize * maxSpeed, maxSpeed)
  }
  
  // Left edge
  if (position.x < rect.left + edgeSize) {
    const distance = rect.left + edgeSize - position.x
    scrollX = -Math.min(distance / edgeSize * maxSpeed, maxSpeed)
  }
  // Right edge
  else if (position.x > rect.right - edgeSize) {
    const distance = position.x - (rect.right - edgeSize)
    scrollX = Math.min(distance / edgeSize * maxSpeed, maxSpeed)
  }
  
  if (scrollX !== 0 || scrollY !== 0) {
    container.scrollBy({ left: scrollX, top: scrollY })
    return { scrollX, scrollY }
  }
  
  return null
}
