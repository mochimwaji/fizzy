class Conversation < ApplicationRecord
  class InvalidStateError < StandardError; end

  include Broadcastable

  belongs_to :user, class_name: "User"
  has_many :messages, dependent: :destroy

  enum :state, %w[ ready thinking ].index_by(&:itself), default: :ready

  def cost
    messages.where.not(cost_microcents: nil).sum(:cost_microcents).to_d / 100_000
  end

  def clear
    messages.delete_all
    touch
  end

  def ask(question, **attributes)
    create_message_with_state_change(**attributes, role: :user, content: question) do
      raise(InvalidStateError, "Can't ask questions while thinking") if thinking?
      thinking!
    end
  end

  def respond(answer, **attributes)
    create_message_with_state_change(**attributes, role: :assistant, content: answer) do
      raise(InvalidStateError, "Can't respond when not thinking") unless thinking?
      ready!
    end
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
