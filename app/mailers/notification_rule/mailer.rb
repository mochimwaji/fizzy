class NotificationRule::Mailer < ApplicationMailer
  def rule_notification(rule, cards)
    @rule = rule
    @cards = cards
    @user = rule.user

    Current.set(account: rule.account) do
      mail(
        to: email_address_with_name(@user.identity.email_address, @user.name),
        subject: notification_subject
      )
    end
  end

  private
    def notification_subject
      cards_count = @cards.size
      if @rule.due_in_days == 0
        "#{cards_count} #{cards_count == 1 ? 'card' : 'cards'} due today - #{@rule.name}"
      elsif @rule.due_in_days == 1
        "#{cards_count} #{cards_count == 1 ? 'card' : 'cards'} due tomorrow - #{@rule.name}"
      elsif @rule.due_in_days.present?
        "#{cards_count} #{cards_count == 1 ? 'card' : 'cards'} due in #{@rule.due_in_days} days - #{@rule.name}"
      else
        "#{cards_count} #{cards_count == 1 ? 'card' : 'cards'} with due dates - #{@rule.name}"
      end
    end
end
