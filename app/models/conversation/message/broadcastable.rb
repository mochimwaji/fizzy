module Conversation::Message::Broadcastable
  extend ActiveSupport::Concern

  def broadcast_create
    broadcast_append_to owner, :conversation,
      target: [ conversation, :transcript ],
      partial: "conversations/messages/message"
  end
end
