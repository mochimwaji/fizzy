class Card::Recurrence < ApplicationRecord
  self.table_name = "card_recurrences"

  belongs_to :card
  belongs_to :account, default: -> { card.account }

  enum :frequency, {
    daily: "daily",
    weekly: "weekly",
    biweekly: "biweekly",
    monthly: "monthly"
  }, prefix: true

  validates :frequency, presence: true
  validates :day_of_week, inclusion: { in: 0..6 }, allow_nil: true
  validates :day_of_month, inclusion: { in: 1..31 }, allow_nil: true

  scope :active, -> { where(active: true) }
  scope :due, -> { active.where("next_occurrence_at <= ?", Time.current) }

  before_create :calculate_next_occurrence

  def pause!
    update!(active: false)
  end

  def resume!
    update!(active: true)
    calculate_and_save_next_occurrence!
  end

  def process!
    return unless active? && next_occurrence_at <= Time.current

    Card::Recurrence::Processor.new(self).process
  end

  def calculate_and_save_next_occurrence!
    calculate_next_occurrence
    save!
  end

  def frequency_description
    case frequency
    when "daily"
      "Every day"
    when "weekly"
      "Every #{Date::DAYNAMES[day_of_week || 0]}"
    when "biweekly"
      "Every other #{Date::DAYNAMES[day_of_week || 0]}"
    when "monthly"
      "Monthly on day #{day_of_month || 1}"
    end
  end

  private

  def calculate_next_occurrence
    self.next_occurrence_at = case frequency
    when "daily"
      next_daily_occurrence
    when "weekly"
      next_weekly_occurrence
    when "biweekly"
      next_biweekly_occurrence
    when "monthly"
      next_monthly_occurrence
    else
      1.day.from_now
    end
  end

  def next_daily_occurrence
    # Next day at 9 AM in account's timezone or UTC
    tomorrow = Date.tomorrow
    Time.zone.local(tomorrow.year, tomorrow.month, tomorrow.day, 9, 0, 0)
  end

  def next_weekly_occurrence
    target_day = day_of_week || Date.current.wday
    days_ahead = target_day - Date.current.wday
    days_ahead += 7 if days_ahead <= 0
    target_date = Date.current + days_ahead.days
    Time.zone.local(target_date.year, target_date.month, target_date.day, 9, 0, 0)
  end

  def next_biweekly_occurrence
    target_day = day_of_week || Date.current.wday
    days_ahead = target_day - Date.current.wday
    days_ahead += 7 if days_ahead <= 0
    days_ahead += 7 # Add extra week for biweekly
    target_date = Date.current + days_ahead.days
    Time.zone.local(target_date.year, target_date.month, target_date.day, 9, 0, 0)
  end

  def next_monthly_occurrence
    target_day = day_of_month || 1
    target_date = Date.current.next_month.beginning_of_month + (target_day - 1).days
    # Handle months with fewer days
    target_date = Date.current.next_month.end_of_month if target_day > Date.current.next_month.end_of_month.day
    Time.zone.local(target_date.year, target_date.month, target_date.day, 9, 0, 0)
  end
end
