class Bubble::Thread
  attr_reader :bubble

  def initialize(bubble)
    @bubble = bubble
  end

  def entries
    sorted_entries.chunk_while { |a, b| consecutive_events?(a, b) }.map.with_index { |entries, index| roll_up(entries, index) }
  end

  def to_partial_path
    "bubbles/threads/thread"
  end

  private
    delegate :events, :comments, to: :bubble, private: true

    def sorted_entries
      (events + comments).sort_by(&:created_at)
    end

    def consecutive_events?(a, b)
      [ a, b ] in [ Event, Event ]
    end

    def roll_up(entries, position)
      case entries.first
      when Comment
        entries.sole
      when Event
        Rollup.new self, entries, first_position: position.zero?
      end
    end
end
