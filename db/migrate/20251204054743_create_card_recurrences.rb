class CreateCardRecurrences < ActiveRecord::Migration[8.2]
  def change
    create_table :card_recurrences, id: :uuid do |t|
      t.references :card, null: false, foreign_key: true, type: :uuid
      t.references :account, null: false, foreign_key: true, type: :uuid
      t.string :frequency, null: false, default: "weekly"
      t.integer :day_of_week
      t.integer :day_of_month
      t.datetime :next_occurrence_at
      t.datetime :last_occurred_at
      t.boolean :active, null: false, default: true

      t.timestamps
    end

    add_index :card_recurrences, [:active, :next_occurrence_at], name: "index_card_recurrences_on_active_and_next"
  end
end
