class Calendars::CardsController < ApplicationController
  layout false

  def show
    @card = Current.user.accessible_cards.find_by!(number: params[:id])
    @return_date = params[:date]
  end
end
