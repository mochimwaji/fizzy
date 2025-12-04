require "test_helper"

class Card::DueableTest < ActiveSupport::TestCase
  # Current.account is already set in test_helper.rb setup
  # We set session after account so Current.user gets populated
  setup do
    Current.session = sessions(:david)
  end

  test "due date scopes" do
    cards(:logo).update!(due_on: Date.current)
    cards(:layout).update!(due_on: Date.tomorrow)
    cards(:text).update!(due_on: Date.yesterday)
    cards(:buy_domain).update!(due_on: nil)

    assert_includes Card.due_today, cards(:logo)
    assert_not_includes Card.due_today, cards(:layout)
    assert_not_includes Card.due_today, cards(:text)

    assert_includes Card.overdue, cards(:text)
    assert_not_includes Card.overdue, cards(:logo)
    assert_not_includes Card.overdue, cards(:layout)

    assert_includes Card.with_due_date, cards(:logo)
    assert_includes Card.with_due_date, cards(:layout)
    assert_includes Card.with_due_date, cards(:text)
    assert_not_includes Card.with_due_date, cards(:buy_domain)

    assert_includes Card.without_due_date, cards(:buy_domain)
    assert_not_includes Card.without_due_date, cards(:logo)
  end

  test "due_this_week scope" do
    cards(:logo).update!(due_on: Date.current)
    cards(:layout).update!(due_on: Date.current.end_of_week)
    cards(:text).update!(due_on: Date.current.end_of_week + 1.day)

    assert_includes Card.due_this_week, cards(:logo)
    assert_includes Card.due_this_week, cards(:layout)
    assert_not_includes Card.due_this_week, cards(:text)
  end

  test "due_soon scope" do
    cards(:logo).update!(due_on: Date.current)
    cards(:layout).update!(due_on: 2.days.from_now.to_date)
    cards(:text).update!(due_on: 5.days.from_now.to_date)

    assert_includes Card.due_soon, cards(:logo)
    assert_includes Card.due_soon, cards(:layout)
    assert_not_includes Card.due_soon, cards(:text)
  end

  test "due status helpers" do
    card = cards(:logo)

    card.update!(due_on: Date.yesterday)
    assert card.overdue?
    assert_equal :overdue, card.due_status

    card.update!(due_on: Date.current)
    assert card.due_today?
    assert_equal :due_today, card.due_status

    card.update!(due_on: Date.tomorrow)
    assert card.due_soon?
    assert_equal :due_soon, card.due_status

    card.update!(due_on: 10.days.from_now.to_date)
    assert card.due?
    assert_not card.due_soon?
    assert_equal :upcoming, card.due_status

    card.update!(due_on: nil)
    assert_not card.due?
    assert_nil card.due_status
  end

  test "set due date creates event" do
    card = cards(:logo)
    card.update!(due_on: nil)

    assert_difference -> { card.events.count }, +1 do
      card.set_due_date(Date.tomorrow)
    end

    event = card.events.last
    assert_equal "card_due_date_set", event.action
    assert_equal Date.tomorrow.iso8601, event.particulars.dig("particulars", "due_on")
  end

  test "change due date creates event" do
    card = cards(:logo)
    card.update!(due_on: Date.current)

    assert_difference -> { card.events.count }, +1 do
      card.update!(due_on: Date.tomorrow)
    end

    event = card.events.last
    assert_equal "card_due_date_changed", event.action
    assert_equal Date.tomorrow.iso8601, event.particulars.dig("particulars", "due_on")
    assert_equal Date.current.iso8601, event.particulars.dig("particulars", "old_due_on")
  end

  test "remove due date creates event" do
    card = cards(:logo)
    card.update!(due_on: Date.current)

    assert_difference -> { card.events.count }, +1 do
      card.remove_due_date
    end

    event = card.events.last
    assert_equal "card_due_date_removed", event.action
    assert_equal Date.current.iso8601, event.particulars.dig("particulars", "old_due_on")
  end
end
