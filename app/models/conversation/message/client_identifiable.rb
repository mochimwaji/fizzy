module Conversation::Message::ClientIdentifiable
  extend ActiveSupport::Concern

  included do
    before_validation :generate_client_message_id, if: -> { client_message_id.blank? }
  end

  def generate_client_message_id
    self.client_message_id = SecureRandom.base36
  end
end
