# Adds system category color customization to boards
# System categories are: not_now, stream, closed
# Colors are stored in a JSON column and default to CSS variable values
module Board::SystemCategoryColors
  extend ActiveSupport::Concern

  SYSTEM_CATEGORIES = %w[not_now stream closed].freeze

  DEFAULT_COLORS = {
    "not_now" => "var(--color-card-1)",      # Gray
    "stream" => "var(--color-card-default)", # Blue
    "closed" => "var(--color-card-complete)" # Dark gray
  }.freeze

  included do
    after_initialize :set_default_system_colors, if: :new_record?
  end

  def system_category_color(category)
    category = category.to_s
    return DEFAULT_COLORS[category] unless SYSTEM_CATEGORIES.include?(category)

    colors = system_category_colors || {}
    colors[category].presence || DEFAULT_COLORS[category]
  end

  def set_system_category_color(category, color)
    category = category.to_s
    return unless SYSTEM_CATEGORIES.include?(category)

    self.system_category_colors ||= {}
    self.system_category_colors[category] = color
  end

  def not_now_color
    system_category_color("not_now")
  end

  def stream_color
    system_category_color("stream")
  end

  def closed_color
    system_category_color("closed")
  end

  private

  def set_default_system_colors
    self.system_category_colors ||= DEFAULT_COLORS.dup
  end
end
