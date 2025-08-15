class Conversation::Message::ResponseGeneratorJob < ApplicationJob
  retry_on RubyLLM::RateLimitError, wait: 2.second, attempts: 3

  def perform(message)
    message.generate_response
  end
end
