module Card::Dueable
  extend ActiveSupport::Concern

  included do
    scope :with_due_date, -> { where.not(due_on: nil) }
    scope :without_due_date, -> { where(due_on: nil) }
    scope :overdue, -> { with_due_date.where(due_on: ...Date.current) }
    scope :due_today, -> { with_due_date.where(due_on: Date.current) }
    scope :due_this_week, -> { with_due_date.where(due_on: Date.current..Date.current.end_of_week) }
    scope :due_soon, -> { with_due_date.where(due_on: Date.current..3.days.from_now.to_date) }
    scope :upcoming, -> { with_due_date.where(due_on: Date.current..) }

    after_save :track_due_date_change, if: :saved_change_to_due_on?
  end

  def due?
    due_on.present?
  end

  def overdue?
    due? && due_on < Date.current
  end

  def due_today?
    due? && due_on == Date.current
  end

  def due_soon?
    due? && due_on >= Date.current && due_on <= 3.days.from_now.to_date
  end

  def set_due_date(date, user: Current.user)
    update!(due_on: date)
  end

  def remove_due_date(user: Current.user)
    update!(due_on: nil)
  end

  def due_status
    if overdue?
      :overdue
    elsif due_today?
      :due_today
    elsif due_soon?
      :due_soon
    elsif due?
      :upcoming
    end
  end

  private
    def track_due_date_change
      return unless Current.user.present?

      if due_on.present? && due_on_before_last_save.nil?
        track_event :due_date_set, particulars: { due_on: due_on.iso8601 }
      elsif due_on.nil? && due_on_before_last_save.present?
        track_event :due_date_removed, particulars: { old_due_on: due_on_before_last_save.iso8601 }
      elsif due_on.present? && due_on_before_last_save.present?
        track_event :due_date_changed, particulars: { old_due_on: due_on_before_last_save.iso8601, due_on: due_on.iso8601 }
      end
    end
end
