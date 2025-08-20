class Ai::Quota < ApplicationRecord
  class UsageExceedsQuotaError < StandardError; end

  include MoneyAccessors, Resettable

  self.table_name = "ai_quotas"

  money_accessor :used, :limit

  belongs_to :user

  validates :limit, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :used, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  def increment_usage(cost)
    cost = Money.wrap(cost)

    transaction do
      reset_if_due
      increment!(:used, cost.in_microcents)
    end
  end

  def ensure_under_limit
    reset_if_due

    if over_limit?
      raise UsageExceedsQuotaError
    end
  end

  def over_limit?
    used >= limit
  end
end
