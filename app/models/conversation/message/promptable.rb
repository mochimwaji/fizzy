module Conversation::Message::Promptable
  extend ActiveSupport::Concern

  def to_llm
    RubyLLM::Message.new(
      role: role.to_sym,
      content: to_prompt,
      tool_calls: nil,
      tool_call_id: nil,
      input_tokens: input_tokens,
      output_tokens: output_tokens,
      model_id: model_id
    )
  end

  def to_prompt
    content.body.fragment.replace("a") { convert_link_to_markdown(it) }.to_plain_text
  end

  private
    def convert_link_to_markdown(node)
      "[#{node.text}](#{node["href"]})"
    end
end
