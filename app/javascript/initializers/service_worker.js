// Register the service worker globally so navigation responses can be served
// from cache immediately and revalidated in the background.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => {
      // Fail silently; push/notifications flows will retry registration when needed.
    })
  })
}
