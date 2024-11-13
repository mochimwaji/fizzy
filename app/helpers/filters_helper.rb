module FiltersHelper
  def filter_chip_id(value, name)
    "#{name}__filter--#{value}"
  end

  def filter_chip_tag(text, name:, value:, **options)
    tag.button id: filter_chip_id(value, name), class: [ "btn txt-small btn--remove", options.delete(:class) ],
        data: { action: "filter-form#removeFilter form#submit", filter_form_target: "button" } do
      concat hidden_field_tag(name, value, id: nil)
      concat tag.span(text)
      concat image_tag("close.svg", aria: { hidden: true }, size: 24)
    end
  end

  def button_to_chip(text, params: {}, data: {})
    if params.present?
      button_to text, filter_chips_path, method: :post, class: "btn btn--plain filter__button", params: params, data: data
    else
      button_tag text, type: :button, class: "btn btn--plain filter__button", data: data
    end
  end
end
