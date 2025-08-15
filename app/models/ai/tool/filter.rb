class Ai::Tool::Filter
  def self.filters
    @filters ||= {}
  end

  def self.register_filters(filters_hash)
    filters_hash.each do |filter_name, method_name|
      register_filter(filter_name, method_name)
    end
  end

  def self.register_filter(filter_name, method_name)
    filters[filter_name] = method_name
  end

  attr_reader :scope, :filters

  def initialize(scope:, filters:)
    @scope = scope
    @filters = filters
  end

  def filter
    self.class.filters.reduce(scope) do |filtered_scope, (filter_name, method_name)|
      if filters[filter_name].present?
        send(method_name, filtered_scope)
      else
        filtered_scope
      end
    end
  end
end
