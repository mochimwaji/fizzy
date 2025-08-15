class CreateConversations < ActiveRecord::Migration[8.1]
  def change
    create_table :conversations do |t|
      t.belongs_to :user, null: false, foreign_key: true, index: { unique: true }
      t.string :state, :string

      t.timestamps
    end
  end
end
