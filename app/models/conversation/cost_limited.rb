module Conversation::CostLimited
  extend ActiveSupport::Concern

  def limit_cost(to:, within: nil)
    raise Conversation::CostExceededError, "Cost limit exceeded" if cost_exceeds?(to, within: within)
  end

  def cost_exceeds?(amount, within: nil)
    cost_microcents(within: within) >= Conversation::Cost.convert_to_microcents(amount)
  end

  def cost(...)
    Conversation::Cost.convert_to_decimal cost_microcents(...)
  end

  def cost_microcents(within: nil)
    within = (within.ago...) if within && !within.is_a?(Range)

    scope = if within
      messages.where(created_at: within)
    else
      messages
    end

    scope.with_cost.sum(:cost_microcents)
  end
end
