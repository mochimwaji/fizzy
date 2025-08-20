class CreateAiQuotas < ActiveRecord::Migration[8.1]
  def change
    create_table :ai_quotas do |t|
      t.belongs_to :user, null: false, foreign_key: true
      t.integer :limit, null: false
      t.integer :used, null: false, default: 0
      t.datetime :reset_at, null: false, index: true

      t.timestamps
    end

    add_index :ai_quotas, :user_id, unique: true
  end
end
