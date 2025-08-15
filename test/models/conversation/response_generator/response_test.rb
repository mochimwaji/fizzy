require "test_helper"

class Conversation::Message::ResponseGenerator::ResponseTest < ActiveSupport::TestCase
  test "price calculations" do
    response = Conversation::Message::ResponseGenerator::Response.new(
      answer: "Hi!",
      input_tokens: 198,
      output_tokens: 2,
      model_id: "gpt-4"
    )

    # The price of an input token is 30 USD per million tokens
    # and 60 USD per million output tokens
    # That's 0.00003 cents per input token and 0.00006 cents
    # per output token
    # Which is 3 micro-cents per input token and 6 micro-cents
    # per output token
    assert_equal "3.0".to_d, response.input_token_price_microcents
    assert_equal "6.0".to_d, response.output_token_price_microcents

    # We've got 198 input tokens, so that's
    # 193 * 3 = 594
    assert_equal 594, response.input_cost_microcents

    # We've got 2 output tokens, so that's
    # 2 * 6 = 12
    assert_equal 12, response.output_cost_microcents

    # So the total is 594 + 12 micro-cents
    assert_equal 606, response.cost_microcents

    # If we convert that to a decimal value we get 0.00606 cents
    assert_equal "0.00606".to_d, response.cost
  end
end
