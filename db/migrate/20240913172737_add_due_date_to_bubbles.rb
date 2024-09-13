class AddDueDateToBubbles < ActiveRecord::Migration[8.0]
  def change
    add_column :bubbles, :due_on, :date
  end
end
