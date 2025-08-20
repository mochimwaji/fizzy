class Conversation < ApplicationRecord
  class InvalidStateError < StandardError; end

  include Broadcastable

  belongs_to :user, class_name: "User"
  has_many :messages, dependent: :destroy

  enum :state, %w[ ready thinking ].index_by(&:itself), default: :ready

  def ask(question, **attributes)
    user.ensure_under_ai_usage_limit

    create_message_with_state_change(**attributes, role: :user, content: question) do
      raise(InvalidStateError, "Can't ask questions while thinking") if thinking?
      thinking!
    end
  end

  def respond(answer, **attributes)
    message = create_message_with_state_change(**attributes, role: :assistant, content: answer) do
      raise(InvalidStateError, "Can't respond when not thinking") unless thinking?
      ready!
    end

    user.increment_ai_usage(message.cost) if message.cost

    message
  end

  private
    def create_message_with_state_change(**attributes)
      message = nil

      transaction do
        yield
        message = messages.create!(**attributes)
      end

      message.broadcast_create
      broadcast_state_change

      message
    end
end
