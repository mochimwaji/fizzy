class AddSendTimeToNotificationRules < ActiveRecord::Migration[8.2]
  def change
    add_column :notification_rules, :send_time, :time, default: "09:00:00"
  end
end
