class Ai::Quota::Money < Data.define(:value)
  include Comparable

  CENTS_PER_DOLLAR = 100
  MICROCENTS_PER_CENT = 1_000_000
  MICROCENTS_PER_DOLLAR = CENTS_PER_DOLLAR * MICROCENTS_PER_CENT
  NUMBER_REGEX = /\d+(\.\d+)?/

  class << self
    def wrap(value)
      microcents = case value
      when nil
        raise ArgumentError, "#{self} can't wrap nil"
      when self
        value.value
      when Integer
        value
      when String
        convert_dollars_to_microcents(BigDecimal(value[NUMBER_REGEX]))
      else
        convert_dollars_to_microcents(value)
      end

      new(microcents)
    end

    def convert_dollars_to_microcents(dollars)
      (dollars.to_d * MICROCENTS_PER_DOLLAR).round.to_i
    end
  end

  def to_i
    in_microcents
  end

  def in_microcents
    value
  end

  def in_dollars
    in_microcents.to_d / MICROCENTS_PER_DOLLAR
  end

  def <=>(other)
    in_microcents <=> self.class.wrap(other).in_microcents
  end

  def +(other)
    other = self.class.wrap(other)
    self.class.new(in_microcents + other.in_microcents)
  end

  def -(other)
    other = self.class.wrap(other)
    self.class.new(in_microcents - other.in_microcents)
  end

  def abs
    self.class.new(in_microcents.abs)
  end
end
