require "test_helper"

class NotificationRuleTest < ActiveSupport::TestCase
  setup do
    @user = users(:david)
    @board = boards(:writebook)
    @tag = tags(:web)
    Current.session = sessions(:david)
  end

  test "creates a notification rule" do
    rule = @user.notification_rules.create!(
      name: "Daily due today",
      frequency: :daily,
      due_in_days: 0
    )

    assert rule.persisted?
    assert_equal "daily", rule.frequency
    assert_equal 0, rule.due_in_days
  end

  test "creates a rule with boards and tags" do
    rule = @user.notification_rules.create!(
      name: "Design board alerts",
      frequency: :weekly,
      due_in_days: 7,
      boards: [@board],
      tags: [@tag]
    )

    assert_equal 1, rule.boards.count
    assert_equal 1, rule.tags.count
    assert_includes rule.boards, @board
    assert_includes rule.tags, @tag
  end

  test "matching_cards returns cards due on specified day" do
    card_due_today = cards(:logo)
    card_due_today.update!(due_on: Date.current)

    card_due_tomorrow = cards(:layout)
    card_due_tomorrow.update!(due_on: Date.tomorrow)

    rule = @user.notification_rules.create!(
      name: "Due today",
      frequency: :daily,
      due_in_days: 0
    )

    matching = rule.matching_cards

    assert_includes matching, card_due_today
    assert_not_includes matching, card_due_tomorrow
  end

  test "matching_cards filters by board" do
    card_in_board = cards(:logo)
    card_in_board.update!(due_on: Date.current)

    # Use private board which is still in 37s account
    other_board = boards(:private)
    other_card = cards(:buy_domain)
    other_card.update!(due_on: Date.current, board: other_board)

    rule = @user.notification_rules.create!(
      name: "Writebook only",
      frequency: :daily,
      due_in_days: 0,
      boards: [@board]
    )

    matching = rule.matching_cards

    assert_includes matching, card_in_board
    assert_not_includes matching, other_card
  end

  test "matching_cards filters by tag" do
    tagged_card = cards(:logo)
    tagged_card.update!(due_on: Date.current)
    tagged_card.tags << @tag unless tagged_card.tags.include?(@tag)

    untagged_card = cards(:layout)
    untagged_card.update!(due_on: Date.current)
    untagged_card.taggings.destroy_all

    rule = @user.notification_rules.create!(
      name: "Tagged cards",
      frequency: :daily,
      due_in_days: 0,
      tags: [@tag]
    )

    matching = rule.matching_cards

    assert_includes matching, tagged_card
    assert_not_includes matching, untagged_card
  end

  test "matching_cards returns cards with any due date when due_in_days is nil" do
    card_due_today = cards(:logo)
    card_due_today.update!(due_on: Date.current)

    card_due_next_week = cards(:layout)
    card_due_next_week.update!(due_on: 7.days.from_now.to_date)

    card_no_due = cards(:text)
    card_no_due.update!(due_on: nil)

    rule = @user.notification_rules.create!(
      name: "All with due dates",
      frequency: :daily,
      due_in_days: nil
    )

    matching = rule.matching_cards

    assert_includes matching, card_due_today
    assert_includes matching, card_due_next_week
    assert_not_includes matching, card_no_due
  end

  test "description generates human readable text" do
    rule = @user.notification_rules.create!(
      name: "Test",
      frequency: :daily,
      due_in_days: 0
    )
    assert_includes rule.description, "due today"

    rule.update!(due_in_days: 1)
    assert_includes rule.description, "due tomorrow"

    rule.update!(due_in_days: 7)
    assert_includes rule.description, "due in 7 days"

    rule.update!(due_in_days: nil)
    assert_includes rule.description, "with any due date"
  end

  test "scopes filter active and inactive rules" do
    active_rule = @user.notification_rules.create!(
      name: "Active",
      frequency: :daily,
      active: true
    )

    inactive_rule = @user.notification_rules.create!(
      name: "Inactive",
      frequency: :daily,
      active: false
    )

    assert_includes NotificationRule.active, active_rule
    assert_not_includes NotificationRule.active, inactive_rule

    assert_includes NotificationRule.inactive, inactive_rule
    assert_not_includes NotificationRule.inactive, active_rule
  end
end
