class NotificationRule < ApplicationRecord
  belongs_to :account, default: -> { user.account }
  belongs_to :user

  has_and_belongs_to_many :boards
  has_and_belongs_to_many :tags

  enum :frequency, { daily: "daily", weekly: "weekly" }, prefix: true

  validates :name, presence: true
  validates :frequency, presence: true
  validates :due_in_days, numericality: { only_integer: true, greater_than_or_equal_to: 0 }, allow_nil: true

  scope :active, -> { where(active: true) }
  scope :inactive, -> { where(active: false) }

  def matching_cards
    scope = account.cards.published.open.with_due_date

    # Filter by boards if any specified
    if boards.any?
      scope = scope.where(board: boards)
    end

    # Filter by tags if any specified
    if tags.any?
      scope = scope.joins(:taggings).where(taggings: { tag_id: tags.pluck(:id) }).distinct
    end

    # Filter by due date if specified
    if due_in_days.present?
      target_date = due_in_days.days.from_now.to_date
      scope = scope.where(due_on: target_date)
    end

    scope
  end

  def description
    parts = []

    if boards.any?
      parts << "in #{boards.map(&:name).to_sentence}"
    end

    if tags.any?
      parts << "tagged #{tags.map(&:title).to_sentence}"
    end

    if due_in_days.present?
      if due_in_days == 0
        parts << "due today"
      elsif due_in_days == 1
        parts << "due tomorrow"
      else
        parts << "due in #{due_in_days} days"
      end
    else
      parts << "with any due date"
    end

    parts.join(", ")
  end
end
