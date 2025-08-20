require "test_helper"

class Ai::QuotaTest < ActiveSupport::TestCase
  setup do
    @quota = Ai::Quota.new(user: users(:jz), limit: "$100")
  end

  test "create" do
    assert @quota.save

    assert_in_delta 7.days.from_now, @quota.reset_at, 1.minute
    assert_equal 0, @quota.used
    assert_equal Ai::Quota::Money.wrap("$100"), @quota.limit
  end

  test "accessors" do
    @quota.limit = nil
    assert_nil @quota.limit

    @quota.limit = "$100"
    assert_kind_of Ai::Quota::Money, @quota.limit
    assert_equal Ai::Quota::Money.wrap("$100"), @quota.limit

    @quota.used = nil
    assert_nil @quota.used

    @quota.used = "$100"
    assert_kind_of Ai::Quota::Money, @quota.used
    assert_equal Ai::Quota::Money.wrap("$100"), @quota.used
  end

  test "increment usage" do
    @quota.save

    @quota.increment_usage("$100")
    assert_equal Ai::Quota::Money.wrap("$100"), @quota.used
    @quota.increment_usage("$500")
    assert_equal Ai::Quota::Money.wrap("$600"), @quota.used
    @quota.increment_usage("$1000")
    assert_equal Ai::Quota::Money.wrap("$1600"), @quota.used
    @quota.increment_usage("$5000")
    assert_equal Ai::Quota::Money.wrap("$6600"), @quota.used
    @quota.increment_usage("$10000")
    assert_equal Ai::Quota::Money.wrap("$16600"), @quota.used

    @quota.reset
    assert_equal Ai::Quota::Money.wrap("$0"), @quota.used
    assert_in_delta 7.days.from_now, @quota.reset_at, 1.minute

    @quota.increment_usage("$10")
    assert_equal Ai::Quota::Money.wrap("$10"), @quota.used
    assert_in_delta 7.days.from_now, @quota.reset_at, 1.minute

    travel 2.days

    @quota.increment_usage("$5")
    assert_equal Ai::Quota::Money.wrap("$15"), @quota.used
    assert_in_delta 5.days.from_now, @quota.reset_at, 1.minute

    travel 8.days

    @quota.increment_usage("$5")
    assert_equal Ai::Quota::Money.wrap("$5"), @quota.used
    assert_in_delta 7.days.from_now, @quota.reset_at, 1.minute
  end

  test "limit checks" do
    @quota.save

    @quota.used = "$0"
    assert_not @quota.over_limit?

    @quota.used = "$300"
    assert @quota.over_limit?

    @quota.used = "$0"
    @quota.ensure_under_limit

    @quota.used = "$300"
    assert_raises Ai::Quota::UsageExceedsQuotaError do
      @quota.ensure_under_limit
    end

    travel 10.days
    @quota.ensure_under_limit
  end

  test "reset" do
    @quota.used = "$15"
    @quota.reset_at = 3.days.from_now

    @quota.reset

    assert_equal Ai::Quota::Money.wrap("$0"), @quota.used
    assert_in_delta 7.days.from_now, @quota.reset_at, 1.minute

    @quota.reset_at = 10.minutes.from_now
    assert_not @quota.due_for_reset?

    @quota.reset_at = 10.minutes.ago
    assert @quota.due_for_reset?

    @quota.reset_at = 10.minutes.from_now
    @quota.used = "$15"
    @quota.reset_if_due
    assert_equal Ai::Quota::Money.wrap("$15"), @quota.used
    assert_in_delta 10.minutes.from_now, @quota.reset_at, 1.minute

    @quota.reset_at = 10.minutes.ago
    @quota.used = "$15"
    @quota.reset_if_due
    assert_equal Ai::Quota::Money.wrap("$0"), @quota.used
    assert_in_delta 7.days.from_now, @quota.reset_at, 1.minute
  end
end
