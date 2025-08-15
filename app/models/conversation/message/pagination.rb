module Conversation::Message::Pagination
  extend ActiveSupport::Concern

  PAGE_SIZE = 10

  included do
    scope :last_page, -> { ordered.last(PAGE_SIZE) }
    scope :before, ->(message) { where(created_at: ...message.created_at, id: ...message.id) }
    scope :page_before, ->(message) { before(message).last_page }
  end
end
