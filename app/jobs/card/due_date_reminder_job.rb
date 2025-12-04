class Card::DueDateReminderJob < ApplicationJob
  queue_as :default

  def perform
    remind_due_today
    remind_due_tomorrow
    remind_overdue
  end

  private
    def remind_due_today
      Card.published.active.due_today.find_each do |card|
        create_reminder_event(card, :due_today_reminder)
      end
    end

    def remind_due_tomorrow
      Card.published.active.with_due_date.where(due_on: Date.tomorrow).find_each do |card|
        create_reminder_event(card, :due_tomorrow_reminder)
      end
    end

    def remind_overdue
      # Only notify once when a card becomes overdue (on the first day)
      Card.published.active.with_due_date.where(due_on: Date.yesterday).find_each do |card|
        create_reminder_event(card, :overdue_reminder)
      end
    end

    def create_reminder_event(card, action)
      Current.with_account(card.account) do
        card.track_event action, creator: card.account.system_user, particulars: { due_on: card.due_on.iso8601 }
      end
    end
end
