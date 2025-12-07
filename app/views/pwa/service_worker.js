const CACHE_NAME = 'fizzy-v2'
const STATIC_CACHE_NAME = 'fizzy-static-v2'

// Assets to cache on install (app shell)
const STATIC_ASSETS = [
  '/favicon.png',
  '/apple-touch-icon.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  // Take control of all clients immediately
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // For assets (JS, CSS, images), use cache-first strategy
  if (isAssetRequest(event.request)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached

        return fetch(event.request).then((response) => {
          // Cache the asset for future use
          if (response.ok) {
            const clone = response.clone()
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // For HTML pages, race cache and network for fastest response
  // This ensures instant navigation if cached, but fresh content wins if network is fast
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      Promise.race([
        // Return cache immediately if available
        caches.match(event.request).then(cached => {
          if (cached) return cached
          // If not cached, wait for network
          return new Promise(() => { }) // Never resolves, lets network win
        }),
        // Fetch from network
        fetch(event.request).then(response => {
          // Update cache in background
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          }
          return response
        })
      ]).catch(() => {
        // If both fail, try cache as fallback
        return caches.match(event.request)
      })
    )
    return
  }

  // For prefetch requests, cache aggressively
  if (event.request.headers.get('Purpose') === 'prefetch' ||
    event.request.headers.get('Sec-Purpose') === 'prefetch') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached

        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone)
            })
          }
          return response
        })
      })
    )
    return
  }
})

function isAssetRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  // Check for common asset extensions
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)(\?.*)?$/.test(path) ||
    path.startsWith('/assets/')
}

self.addEventListener("push", async (event) => {
  const data = await event.data.json()
  event.waitUntil(Promise.all([showNotification(data), updateBadgeCount(data.options)]))
})

async function showNotification({ title, options }) {
  return self.registration.showNotification(title, options)
}

async function updateBadgeCount({ data: { badge } }) {
  return self.navigator.setAppBadge?.(badge || 0)
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const url = new URL(event.notification.data.path, self.location.origin).href
  event.waitUntil(openURL(url))
})

async function openURL(url) {
  const clients = await self.clients.matchAll({ type: "window" })
  const focused = clients.find((client) => client.focused)

  if (focused) {
    await focused.navigate(url)
  } else {
    await self.clients.openWindow(url)
  }
}
