Color = Struct.new(:name, :value)

class Color
  class << self
    def for_value(value)
      COLORS.find { |it| it.value == value }
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
end
