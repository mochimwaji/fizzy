module FormsHelper
  def auto_submit_form_with(**attributes, &)
    data = attributes.delete(:data) || {}
    data[:controller] = "auto-submit #{data[:controller]}".strip
    # Auto-submit forms typically redirect - break out of SPA frame
    data[:turbo_frame] ||= "_top"

    if block_given?
      form_with **attributes, data: data, &
    else
      form_with(**attributes, data: data) { }
    end
  end
end

