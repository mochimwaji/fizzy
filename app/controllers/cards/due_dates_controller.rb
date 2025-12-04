class Cards::DueDatesController < ApplicationController
  include CardScoped

  def new
  end

  def create
    @card.set_due_date(due_date_params[:due_on])
    render_card_replacement
  end

  def destroy
    @card.remove_due_date
    render_card_replacement
  end

  private
    def due_date_params
      params.expect(due_date: [ :due_on ])
    end
end
