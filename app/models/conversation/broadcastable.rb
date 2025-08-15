module Conversation::Broadcastable
  extend ActiveSupport::Concern

  def broadcast_state_change
    broadcast_replace_to user, :conversation,
      target: [ self, :thinking_indicator ],
      partial: "conversations/show/thinking_indicator"
  end
end
