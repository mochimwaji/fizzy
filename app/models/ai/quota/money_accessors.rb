module Ai::Quota::MoneyAccessors
  extend ActiveSupport::Concern

  class_methods do
    def money_accessor(*attribute_names)
      attribute_names.each do |name|
        define_method(name) do
          if super()
            Ai::Quota::Money.new(super())
          end
        end

        define_method("#{name}=") do |value|
          value = Ai::Quota::Money.wrap(value).in_microcents if value
          super(value)
        end
      end
    end
  end
end
