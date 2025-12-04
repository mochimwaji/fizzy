class Cards::RecurrencesController < ApplicationController
  include CardScoped

  def new
    @recurrence = @card.recurrence || @card.build_recurrence
  end

  def create
    @card.setup_recurrence(
      frequency: recurrence_params[:frequency],
      day_of_week: recurrence_params[:day_of_week].presence&.to_i,
      day_of_month: recurrence_params[:day_of_month].presence&.to_i
    )

    respond_to do |format|
      format.turbo_stream { render_card_replacement }
      format.html { redirect_to @card }
    end
  end

  def update
    if @card.recurrence.present?
      @card.recurrence.update!(
        frequency: recurrence_params[:frequency],
        day_of_week: recurrence_params[:day_of_week].presence&.to_i,
        day_of_month: recurrence_params[:day_of_month].presence&.to_i,
        active: recurrence_params[:active] != "0"
      )
      @card.recurrence.calculate_and_save_next_occurrence! if @card.recurrence.active?
    end

    respond_to do |format|
      format.turbo_stream { render_card_replacement }
      format.html { redirect_to @card }
    end
  end

  def destroy
    @card.remove_recurrence

    respond_to do |format|
      format.turbo_stream { render_card_replacement }
      format.html { redirect_to @card }
    end
  end

  private

  def recurrence_params
    params.expect(recurrence: [:frequency, :day_of_week, :day_of_month, :active])
  end
end
