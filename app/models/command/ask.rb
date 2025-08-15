class Command::Ask < Command
  store_accessor :data, :question, :card_ids

  def title
    "Ask '#{question}'"
  end

  def execute
    conversation = Conversation.create_or_find_by(user: Current.user)
    conversation.ask(question) if question.present?

    Command::Result::ShowModal.new(turbo_frame: "conversation", url: conversation_path)
  end
end
