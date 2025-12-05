Color = Struct.new(:name, :value)

class Color
  class << self
    def for_value(value)
      all_colors.find { |it| it.value == value }
    end

    def all_colors
      COLORS + MOBILE_EXTRA_COLORS
    end
  end

  def to_s
    value
  end

  COLORS = {
    "Blue" => "var(--color-card-default)",
    "Gray" => "var(--color-card-1)",
    "Tan" => "var(--color-card-2)",
    "Yellow" => "var(--color-card-3)",
    "Lime" => "var(--color-card-4)",
    "Aqua" => "var(--color-card-5)",
    "Violet" => "var(--color-card-6)",
    "Purple" => "var(--color-card-7)",
    "Pink" => "var(--color-card-8)",
    "Red" => "var(--color-card-9)",
    "Orange" => "var(--color-card-10)",
    "Green" => "var(--color-card-11)",
    "Sky" => "var(--color-card-12)"
  }.collect { |name, value| new(name, value) }.freeze

  # Additional colors available in mobile view
  MOBILE_EXTRA_COLORS = {
    "Coral" => "#FF6B6B",
    "Teal" => "#20B2AA",
    "Indigo" => "#5C6BC0",
    "Amber" => "#FFB300",
    "Slate" => "#607D8B"
  }.collect { |name, value| new(name, value) }.freeze
end
