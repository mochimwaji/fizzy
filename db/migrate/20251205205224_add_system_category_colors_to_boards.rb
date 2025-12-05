class AddSystemCategoryColorsToBoards < ActiveRecord::Migration[8.2]
  def change
    add_column :boards, :system_category_colors, :json
  end
end
