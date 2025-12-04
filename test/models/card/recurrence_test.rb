require "test_helper"

class Card::RecurrenceTest < ActiveSupport::TestCase
  setup do
    Current.account = accounts("37s")
    Current.session = sessions(:david)
    @card = cards(:logo)
  end

  test "creating a recurrence sets next_occurrence_at" do
    recurrence = @card.create_recurrence!(
      frequency: :weekly,
      day_of_week: 1,
      account: @card.account
    )

    assert_not_nil recurrence.next_occurrence_at
    assert recurrence.next_occurrence_at > Time.current
  end

  test "frequency_description for daily" do
    recurrence = @card.create_recurrence!(frequency: :daily, account: @card.account)
    assert_equal "Every day", recurrence.frequency_description
  end

  test "frequency_description for weekly" do
    recurrence = @card.create_recurrence!(frequency: :weekly, day_of_week: 1, account: @card.account)
    assert_equal "Every Monday", recurrence.frequency_description
  end

  test "frequency_description for monthly" do
    recurrence = @card.create_recurrence!(frequency: :monthly, day_of_month: 15, account: @card.account)
    assert_equal "Monthly on day 15", recurrence.frequency_description
  end

  test "pause and resume" do
    recurrence = @card.create_recurrence!(frequency: :weekly, day_of_week: 1, account: @card.account)

    recurrence.pause!
    assert_not recurrence.active?

    recurrence.resume!
    assert recurrence.active?
  end

  test "due scope finds due recurrences" do
    recurrence = @card.create_recurrence!(
      frequency: :daily,
      account: @card.account
    )

    recurrence.update_column(:next_occurrence_at, 1.hour.ago)

    assert_includes Card::Recurrence.due, recurrence
  end

  test "due scope excludes future recurrences" do
    recurrence = @card.create_recurrence!(
      frequency: :daily,
      account: @card.account
    )

    recurrence.update_column(:next_occurrence_at, 1.hour.from_now)

    assert_not_includes Card::Recurrence.due, recurrence
  end
end
