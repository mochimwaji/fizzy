module Card::Recurring
  extend ActiveSupport::Concern

  included do
    has_one :recurrence, class_name: "Card::Recurrence", dependent: :destroy

    scope :recurring, -> { joins(:recurrence) }
    scope :with_active_recurrence, -> { joins(:recurrence).where(card_recurrences: { active: true }) }
  end

  def recurring?
    recurrence.present?
  end

  def recurrence_active?
    recurrence&.active?
  end

  def setup_recurrence(frequency:, day_of_week: nil, day_of_month: nil)
    if recurrence.present?
      recurrence.update!(
        frequency: frequency,
        day_of_week: day_of_week,
        day_of_month: day_of_month,
        active: true
      )
      recurrence.calculate_and_save_next_occurrence!
    else
      create_recurrence!(
        frequency: frequency,
        day_of_week: day_of_week,
        day_of_month: day_of_month,
        active: true,
        account: account
      )
    end
  end

  def remove_recurrence
    recurrence&.destroy
  end
end
