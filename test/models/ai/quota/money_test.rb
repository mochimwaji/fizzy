require "test_helper"

class Ai::Quota::MoneyTest < ActiveSupport::TestCase
  test "wrapping" do
    money = Ai::Quota::Money.wrap("$5.42")
    assert_equal 5_42_000_000, money.in_microcents, "Strings with numbers are treated as dollars"

    assert_raises TypeError do
      Ai::Quota::Money.wrap("foobar")
    end

    money = Ai::Quota::Money.wrap(5.42)
    assert_equal 5_42_000_000, money.in_microcents, "Decimals are treated as dollars"

    money = Ai::Quota::Money.wrap(5)
    assert_equal 5, money.in_microcents, "Integers are treated as microcents"

    money1 = Ai::Quota::Money.wrap("$5")
    money2 = Ai::Quota::Money.wrap(money1)
    assert_equal money1, money2, "Money can wrap itself"

    assert_raises ArgumentError do
      Ai::Quota::Money.wrap(nil)
    end
  end

  test "conversions" do
    money = Ai::Quota::Money.wrap("$0")
    assert_equal 0.0, money.in_dollars
    assert_equal 0, money.in_microcents

    money = Ai::Quota::Money.wrap("$1")
    assert_equal 1, money.in_dollars
    assert_equal 1_00_000_000, money.in_microcents

    money = Ai::Quota::Money.wrap("$5.42")
    assert_equal 5.42, money.in_dollars
    assert_equal 5_42_000_000, money.in_microcents
  end
end
