class CreateConversationMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :conversation_messages do |t|
      t.belongs_to :conversation, null: false, foreign_key: true
      t.string :role, null: false
      t.string :client_message_id, null: false
      t.string :model_id
      t.bigint :input_tokens
      t.bigint :output_tokens
      t.bigint :input_cost_microcents
      t.bigint :output_cost_microcents
      t.bigint :cost_microcents

      t.timestamps
    end
  end
end
