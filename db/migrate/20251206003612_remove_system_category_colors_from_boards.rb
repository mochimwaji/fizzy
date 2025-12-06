class RemoveSystemCategoryColorsFromBoards < ActiveRecord::Migration[8.2]
  def change
    remove_column :boards, :system_category_colors, :json
  end
end
