module Conversation::Cost
  CENTS_PER_DOLLAR = 100
  MICROCENTS_PER_CENT = 1_000_000
  MICROCENTS_PER_DOLLAR = CENTS_PER_DOLLAR * MICROCENTS_PER_CENT
  NUMBER_REGEX = /\d+(\.\d+)?/

  extend self

  def convert_to_microcents(value)
    case value
    when String
      decimal_to_microcents(value[NUMBER_REGEX].to_d)
    when Float, BigDecimal
      decimal_to_microcents(value)
    when Numeric
      value
    else
      raise ArgumentError, "Invalid cost value: #{value}"
    end
  end

  def convert_to_decimal(microcents)
    microcents.to_d / MICROCENTS_PER_DOLLAR
  end

  private
    def decimal_to_microcents(decimal)
      (decimal.to_d * MICROCENTS_PER_DOLLAR).round.to_i
    end
end
