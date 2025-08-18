import { Controller } from "@hotwired/stimulus"
import { post } from "@rails/request.js"

export default class extends Controller {
  static targets = [ "modalTurboFrame" ]
  static outlets = [ "dialog" ]
  static values = {
    searchUrl: String,
    searchTurboFrameName: String,
    askUrl: String,
    askTurboFrameName: String
  }

  search() {
    this.#openInTurboFrame(this.searchTurboFrameNameValue, this.searchUrlValue)
    this.dialogOutlet.open()
  }

  async ask() {
    this.#initializeConversation()
    this.#openInTurboFrame(this.askTurboFrameNameValue, this.askUrlValue)
    this.dialogOutlet.open()
  }

  #openInTurboFrame(name, url) {
    this.modalTurboFrameTarget.id = name
    this.modalTurboFrameTarget.src = url
  }

  #initializeConversation() {
    post(this.askUrlValue)
  }
}
