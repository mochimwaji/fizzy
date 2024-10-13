class Current {
  get user() {
    const currentUserId = this.#extractContentFromMetaTag("current-user-id")

    if (currentUserId) {
      return { id: parseInt(currentUserId) }
    }
  }

  #extractContentFromMetaTag(name) {
    return document.head.querySelector(`meta[name="${name}"]`)?.getAttribute("content")
  }
}

window.Current = new Current()
