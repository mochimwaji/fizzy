class NotificationRule::ProcessJob < ApplicationJob
  queue_as :default

  def perform(frequency: "daily")
    NotificationRule.active.where(frequency: frequency).includes(:user, :account).find_each do |rule|
      process_rule(rule)
    end
  end

  private
    def process_rule(rule)
      return if rule.account.nil?

      Current.with_account(rule.account) do
        cards = rule.matching_cards.to_a
        return if cards.empty?

        NotificationRule::Mailer.rule_notification(rule, cards).deliver_later
      end
    end
end
