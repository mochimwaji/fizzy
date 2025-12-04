class CreateNotificationRules < ActiveRecord::Migration[8.2]
  def change
    create_table :notification_rules, id: :uuid do |t|
      t.references :account, type: :uuid, null: false, index: true
      t.references :user, type: :uuid, null: false, index: true
      t.string :name, null: false
      t.string :frequency, null: false, default: "daily"
      t.integer :due_in_days # nil means match any due date, 0 = today, 1 = tomorrow, etc.
      t.boolean :active, null: false, default: true
      t.timestamps
    end

    add_index :notification_rules, [:user_id, :active]

    # Join table for boards - Rails expects alphabetical order
    create_table :boards_notification_rules, id: false do |t|
      t.references :notification_rule, type: :uuid, null: false, index: true
      t.references :board, type: :uuid, null: false, index: true
    end

    add_index :boards_notification_rules, [:notification_rule_id, :board_id], unique: true, name: "idx_notification_rules_boards_unique"

    # Join table for tags - Rails expects alphabetical order
    create_table :notification_rules_tags, id: false do |t|
      t.references :notification_rule, type: :uuid, null: false, index: true
      t.references :tag, type: :uuid, null: false, index: true
    end

    add_index :notification_rules_tags, [:notification_rule_id, :tag_id], unique: true, name: "idx_notification_rules_tags_unique"
  end
end
