import { Controller } from "@hotwired/stimulus"
import { onNextEventLoopTick, nextFrame } from "helpers/timing_helpers"

export default class extends Controller {
  static targets = [ "textInput", "submitButton", "clientMessageIdInput" ]
  static outlets = [ "conversation--messages" ]

  #submittingMessage

  connect() {
    this.#submittingMessage = false
    onNextEventLoopTick(() => this.textInputTarget.focus())
  }

  submit(event) {
    event.preventDefault()

    if (!this.#submittingMessage) {
      this.#submittingMessage = true
      this.#submitMessage()
    }
  }

  submitEnd(even) {
    this.#submittingMessage = false

    if (event.detail.success) {
      this.#reset()
    } else {
      this.conversationMessagesOutlet.failPendingMessage(this.clientMessageIdInputTarget.value)
    }
  }

  async #submitMessage() {
    if (this.#validInput()) {
      const messageId = this.#generateMessageId()

      await this.conversationMessagesOutlet.insertPendingMessage(messageId, this.#messageText)
      await nextFrame()
      this.conversationMessagesOutlet.scrollToBottom()

      this.clientMessageIdInputTarget.value = messageId
      this.element.requestSubmit()
    }
  }

  get #messageText() {
    return this.textInputTarget.value
  }

  #validInput() {
    return this.#messageText.trim().length > 0
  }

  #generateMessageId() {
    return Math.random().toString(36).slice(2)
  }

  #reset() {
    this.textInputTarget.value = ""
    this.clientMessageIdInputTarget.value = ""
  }
}
