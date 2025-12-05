class Cards::TriagesController < ApplicationController
  include CardScoped

  def create
    column = @card.board.columns.find(params[:column_id])
    @card.triage_into(column)

    render_card_replacement
  end

  def destroy
    @card.send_back_to_triage
    render_card_replacement
  end
end
