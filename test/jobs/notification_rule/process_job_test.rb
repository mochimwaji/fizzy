require "test_helper"

class NotificationRule::ProcessJobTest < ActiveJob::TestCase
  include ActionMailer::TestHelper

  setup do
    @user = users(:david)
    @account = @user.account
    Current.session = sessions(:david)
  end

  test "processes daily rules" do
    card = cards(:logo)
    card.update!(due_on: Date.current)

    rule = @user.notification_rules.create!(
      name: "Daily due today",
      frequency: :daily,
      due_in_days: 0,
      active: true,
      account: @account
    )

    assert_emails 1 do
      NotificationRule::ProcessJob.perform_now(frequency: "daily")
    end
  end

  test "processes weekly rules" do
    card = cards(:logo)
    card.update!(due_on: 7.days.from_now.to_date)

    rule = @user.notification_rules.create!(
      name: "Weekly in a week",
      frequency: :weekly,
      due_in_days: 7,
      active: true,
      account: @account
    )

    assert_emails 1 do
      NotificationRule::ProcessJob.perform_now(frequency: "weekly")
    end
  end

  test "does not process inactive rules" do
    card = cards(:logo)
    card.update!(due_on: Date.current)

    rule = @user.notification_rules.create!(
      name: "Inactive rule",
      frequency: :daily,
      due_in_days: 0,
      active: false,
      account: @account
    )

    assert_no_emails do
      NotificationRule::ProcessJob.perform_now(frequency: "daily")
    end
  end

  test "does not send email when no matching cards" do
    rule = @user.notification_rules.create!(
      name: "No matches",
      frequency: :daily,
      due_in_days: 0,
      active: true,
      account: @account
    )

    # Ensure no cards due today
    Card.update_all(due_on: nil)

    assert_no_emails do
      NotificationRule::ProcessJob.perform_now(frequency: "daily")
    end
  end

  test "only processes rules of specified frequency" do
    card = cards(:logo)
    card.update!(due_on: Date.current)

    daily_rule = @user.notification_rules.create!(
      name: "Daily",
      frequency: :daily,
      due_in_days: 0,
      active: true,
      account: @account
    )

    weekly_rule = @user.notification_rules.create!(
      name: "Weekly",
      frequency: :weekly,
      due_in_days: 0,
      active: true,
      account: @account
    )

    assert_emails 1 do
      NotificationRule::ProcessJob.perform_now(frequency: "daily")
    end
  end
end
