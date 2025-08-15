require "test_helper"

class Conversation::MessageTest < ActiveSupport::TestCase
  include ActiveJob::TestHelper
  include VcrTestHelper

  test "emoji content" do
    message = Conversation::Message.new(content: "Hello 😊")
    assert_not message.all_emoji?, "Message with mixed content should not be all emoji"

    message.content = "😊"
    assert message.all_emoji?, "Message with only emoji should be recognized as all emoji"
  end

  test "conversion to prompt" do
    message = Conversation::Message.new(
      content: <<~HTML
        I think you might like <a href="https://www.youtube.com/watch?v=xVRVVgBnYEE">this video</a>
      HTML
    )

    assert_match "[this video](https://www.youtube.com/watch?v=xVRVVgBnYEE)", message.to_prompt, "Links are represented as markdown"
  end

  test "conversion to an RubyLLM::Message" do
    message = Conversation::Message.new(
      role: :user,
      content: "Hi!",
      input_tokens: 2,
      output_tokens: 4,
      model_id: "gpt-4.1"
    )

    llm_message = message.to_llm

    assert_instance_of RubyLLM::Message, llm_message
    assert_equal :user, llm_message.role
    assert_equal "Hi!", llm_message.content
    assert_nil llm_message.tool_calls
    assert_nil llm_message.tool_call_id
    assert_equal 2, llm_message.input_tokens
    assert_equal 4, llm_message.output_tokens
    assert_equal "gpt-4.1", llm_message.model_id
  end

  test "response generation" do
    message = conversation_messages(:davids_question)

    assert_enqueued_with(job: Conversation::Message::ResponseGeneratorJob) do
      message.generate_response_later
    end

    response = message.generate_response

    assert_instance_of Conversation::Message, response
    assert_equal message.conversation_id, response.conversation_id
  end
end
