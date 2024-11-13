class CreateFilterAssignerJoinTable < ActiveRecord::Migration[8.0]
  def change
    create_join_table :filters, :assigners do |t|
      t.index :filter_id
      t.index :assigner_id
    end
  end
end
