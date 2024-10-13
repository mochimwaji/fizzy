import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static classes = [ "myComment" ]

  connect() {
    this.#myComments.forEach(comment => comment.classList.add(this.myCommentClass))
  }

  get #myComments() {
    return this.element.querySelectorAll(`.comment[data-creator-id='${Current.user.id}']`)
  }
}
