import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "cancel" ]

  submit() {
    this.element.requestSubmit()
  }

  cancel() {
    this.cancelTarget?.click()
  }

  preventAttachment(event) {
    event.preventDefault()
  }

  showPicker(event) {
    if ("showPicker" in HTMLInputElement.prototype) {
      event.target.showPicker()
    }
  }
}
