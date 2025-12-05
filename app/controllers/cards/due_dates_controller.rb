class Cards::DueDatesController < ApplicationController
  include CardScoped

  def new
  end

  def create
    @card.set_due_date(due_date_params[:due_on])
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to card_path(@card) }
    end
  end

  def update
    @card.set_due_date(due_date_params[:due_on])
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to card_path(@card) }
    end
  end

  def destroy
    @card.remove_due_date
    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to card_path(@card) }
    end
  end

  private
    def due_date_params
      params.expect(due_date: [ :due_on ])
    end
end
