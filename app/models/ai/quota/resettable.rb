module Ai::Quota::Resettable
  extend ActiveSupport::Concern

  included do
    before_create -> { reset }
    scope :due_for_reset, -> { where(reset_at: ...Time.current) }
  end

  def reset_if_due
    reset if due_for_reset?
  end

  def reset
    attributes = { used: 0, reset_at: 7.days.from_now }

    if persisted?
      update(**attributes)
    else
      assign_attributes(**attributes)
    end
  end

  def due_for_reset?
    reset_at.before?(Time.current)
  end
end
