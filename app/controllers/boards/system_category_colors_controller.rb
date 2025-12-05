class Boards::SystemCategoryColorsController < ApplicationController
  include BoardScoped

  def update
    category = params[:category]
    color = params[:color]

    if Board::SystemCategoryColors::SYSTEM_CATEGORIES.include?(category)
      @board.set_system_category_color(category, color)
      @board.save!
    end

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to board_path(@board) }
    end
  end
end
