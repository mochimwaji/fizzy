module User::AiQuota
  extend ActiveSupport::Concern

  included do
    has_one :ai_quota, class_name: "Ai::Quota"
  end

  def fetch_or_create_ai_quota
    ai_quota || create_ai_quota!(limit: Ai::Quota::Money.wrap("$100"))
  end

  def increment_ai_usage(cost)
    fetch_or_create_ai_quota.increment_usage(cost)
  end

  def ensure_under_ai_usage_limit
    fetch_or_create_ai_quota.ensure_under_limit
  end
end
