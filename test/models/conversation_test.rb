require "test_helper"

class ConversationTest < ActiveSupport::TestCase
  include VcrTestHelper

  test "asking questions" do
    conversation = users(:kevin).conversation

    # You can't respond to a conversation while it's in the thinking state
    assert_raises(Conversation::InvalidStateError) do
      conversation.respond("Ok")
    end

    assert_raises(ActiveRecord::RecordInvalid) do
      conversation.ask("")
    end

    conversation.reload

    assert conversation.ready?, "The conversation should be ready before a question is asked"

    message = nil
    assert_turbo_stream_broadcasts [ conversation.user, :conversation ], count: +2 do
      message = conversation.ask("What is the meaning of life, the Universe, and everything else?", client_message_id: "deep-thought")
    end

    assert_not_nil message, "A message should be created when a question is asked"
    assert message.persisted?, "The message should be saved to the database"
    assert_equal "What is the meaning of life, the Universe, and everything else?", message.content.to_plain_text.chomp, "The message content should match the question asked"
    assert message.user?, "The message role should be 'user' for a question"
    assert_equal "deep-thought", message.client_message_id, "Additional attributes should be set correctly"
    assert conversation.thinking?, "The conversation should switch to thinking after a question is asked"
  end

  test "responding to questions" do
    conversation = users(:david).conversation

    # You can't ask a question in a conversation that isn't ready
    assert_raises(Conversation::InvalidStateError) do
      conversation.ask("hi!")
    end

    assert_raises(ActiveRecord::RecordInvalid) do
      conversation.respond("")
    end

    conversation.reload

    assert conversation.thinking?, "The conversation should be thinking before a response is made"

    message = nil
    assert_turbo_stream_broadcasts [ conversation.user, :conversation ], count: +2 do
      message = conversation.respond("42", client_message_id: "deep-thought-response")
    end

    assert_not_nil message, "A message should be created when a response is made"
    assert message.persisted?, "The message should be saved to the database"
    assert_equal "42", message.content.to_plain_text.chomp, "The message content should match the response given"
    assert message.assistant?, "The message role should be 'assistant' for a response"
    assert_equal "deep-thought-response", message.client_message_id, "Asdditional attributes should be set correctly"
    assert conversation.ready?, "The conversation should switch back to ready after a response is made"
  end

  test "clearing conversation messages" do
    conversation = conversations(:kevin)

    assert conversation.messages.any?, "The conversation should have messages before clearing"

    original_updated_at = conversation.updated_at
    conversation.clear
    assert conversation.updated_at > original_updated_at, "The conversation's updated_at timestamp should change after clearing messages"

    assert conversation.messages.empty?, "All messages should be deleted when clearing the conversation"
  end

  test "cost calculation" do
    conversation = conversations(:kevin)

    assert_equal "0.01053".to_d, conversation.cost
  end
end
