class Notifier::CardEventNotifier < Notifier
  delegate :creator, to: :source
  delegate :board, to: :card

  private
    def recipients
      case source.action
      when "card_assigned"
        source.assignees.excluding(creator)
      when "card_published"
        board.watchers.without(creator, *card.mentionees).including(*card.assignees).uniq
      when "comment_created"
        card.watchers.without(creator, *source.eventable.mentionees)
      when "card_due_today_reminder", "card_due_tomorrow_reminder", "card_overdue_reminder"
        due_date_reminder_recipients
      else
        board.watchers.without(creator)
      end
    end

    def card
      source.eventable
    end

    def due_date_reminder_recipients
      # Notify assignees if present, otherwise notify the card creator
      (card.assignees.presence || [ card.creator ]).reject { |user| !user.active? || user.system? }
    end
end
