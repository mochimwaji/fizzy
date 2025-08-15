class Command::Result::ShowModal
  attr_reader :url, :turbo_frame

  def initialize(url:, turbo_frame:)
    @url = url
    @turbo_frame = turbo_frame
  end

  def as_json
    { turbo_frame: turbo_frame, url: url }
  end
end
