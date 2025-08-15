import { Controller } from "@hotwired/stimulus"
import { nextFrame } from "helpers/timing_helpers"

export default class extends Controller {
  static SCROLL_TRESHOLD = 100
  static EMOJI_MATCHER = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\uFE0F)+$/gu

  static targets = [ "messages", "messageTemplate" ]
  static classes = [ "failedMessage", "emojiMessage" ]

  connect() {
    this.scrollToBottom()
  }

  failPendingMessage(clientMessageId) {
    const message = this.element.querySelector(`#message_${clientMessageId}`)

    if (message) {
      message.classList.add(this.failedMessageClass)
    }
  }

  async insertPendingMessage(clientMessageId, content) {
    const html = this.#pendingMessageHtml({
      clientMessageId: clientMessageId,
      content: content,
      extraClasses: this.#allEmoji(content) ? this.emojiMessageClass : ""
    })

    this.messagesTarget.insertAdjacentHTML("beforeend", html)

    await nextFrame()
    this.scrollToBottom()
  }

  scrollToBottom() {
    this.messagesTarget.scrollTop = this.messagesTarget.scrollHeight
  }

  beforeStreamRender(event) {
    const target = event.detail.newStream.getAttribute("target")

    if (target === this.messagesTarget.id) {
      this.#handleScrollPositionOnTurboStreamRender(event)
    }
  }

  #pendingMessageHtml(data) {
    let html = this.messageTemplateTarget.innerHTML

    for (const key in data) {
      html = html.replaceAll(`$${key}$`, data[key])
    }

    return html
  }

  #allEmoji(content) {
    return content.match(this.constructor.EMOJI_MATCHER)
  }

  #handleScrollPositionOnTurboStreamRender(event) {
    if (event.detail.newStream.action === "append") {
      this.#scrollToBottomOnTurboStreamRender(event)
    } else {
      this.#preserveScrollPositionOnTurboStreamRender(event)
    }
  }

  #scrollToBottomOnTurboStreamRender(event) {
    const render = event.detail.render

    event.detail.render = async (streamElement) => {
      await render(streamElement)
      await nextFrame()
      this.scrollToBottom()
    }
  }

  #preserveScrollPositionOnTurboStreamRender(event) {
    const render = event.detail.render

    event.detail.render = async (streamElement) => {
      const previousScrollHeight = this.element.scrollHeight
      const previousScrollTop = this.element.scrollTop
      const previouslyWasAtBottom = this.#scrolledToBottom

      await render(streamElement)

      if (previouslyWasAtBottom) {
        this.messagesTarget.scrollTop = this.messagesTarget.scrollHeight
      } else {
        const newScrollHeight = this.element.scrollHeight
        const scrollDelta = newScrollHeight - previousScrollHeight
        this.element.scrollTop = previousScrollTop + scrollDelta
      }

      await nextFrame()
    }
  }

  get #scrolledToBottom() {
    const scrollBottom = this.element.scrollTop + this.element.clientHeight
    const contentBottom = this.element.scrollHeight - this.constructor.SCROLL_THRESHOLD

    return scrollBottom >= contentBottom
  }
}
