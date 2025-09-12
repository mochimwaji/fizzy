class My::FilterExpansionsController < ApplicationController
  include FilterScoped

  def create
    render turbo_stream: turbo_stream.replace("filter-settings", partial: "filters/settings", locals: { user_filtering: @user_filtering })
  end
end
