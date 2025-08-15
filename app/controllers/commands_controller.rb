class CommandsController < ApplicationController
  def index
    @commands = Current.user.commands.root.order(created_at: :desc).limit(20).reverse
  end

  def create
    command = parse_command(params[:command])

    if command.valid?
      if confirmed?(command)
        command.save!
        result = command.execute
        respond_with_execution_result(result)
      else
        respond_with_needs_confirmation(command)
      end
    else
      respond_with_error(command)
    end
  end

  private
    def parse_command(string)
      command_parser.parse(string)
    end

    def command_parser
      @command_parser ||= Command::Parser.new(parsing_context)
    end

    def parsing_context
      @parsing_context ||= Command::Parser::Context.new(Current.user, url: request.referrer, script_name: request.script_name)
    end

    def confirmed?(command)
      !command.needs_confirmation? || params[:confirmed].present?
    end

    def respond_with_execution_result(result)
      # This saves unnecessary back and forth between server and client (e.g: to redirect)-
      result = result.is_a?(Array) && result.one? ? result.first : result

      case result
      when Array
        respond_with_composite_response(result)
      when Command::Result::Redirection
        redirect_to result.url
      when Command::Result::ShowModal
        respond_with_turbo_frame_modal(result.turbo_frame, result.url)
      else
        redirect_back_or_to root_path
      end
    end

    def respond_with_needs_confirmation(command)
      redirection_url = command.context.url unless command.context.url == parsing_context.url
      render json: { confirmation: command.confirmation_prompt, redirect_to: redirection_url }, status: :conflict
    end

    def respond_with_composite_response(results)
      json = results.map(&:as_json).grep(Hash).reduce({}, :merge)
      if json.empty?
        redirect_back_or_to root_path
      else
        render json: json, status: :accepted
      end
    end

    def respond_with_insight_response(chat_response)
      render json: { message: chat_response.content }, status: :accepted
    end

    def respond_with_turbo_frame_modal(turbo_frame, url)
      render json: { turbo_frame: turbo_frame, url: url }, status: :accepted
    end

    def respond_with_error(command)
      error_message = command.error_messages.map { |msg| "- #{msg}\n" }.join
      render json: { error: error_message, context_url: command.context.url }, status: :unprocessable_entity
    end
end
