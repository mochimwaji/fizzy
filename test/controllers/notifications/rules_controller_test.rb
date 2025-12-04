require "test_helper"

class Notifications::RulesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:david)
    sign_in_as @user
    @board = boards(:writebook)
  end

  test "index lists user's notification rules" do
    rule = @user.notification_rules.create!(name: "Test Rule", frequency: :daily)

    get notifications_rules_path
    assert_response :success
    assert_select "div", text: /Test Rule/
  end

  test "new renders form" do
    get new_notifications_rule_path
    assert_response :success
    assert_select "form"
  end

  test "create notification rule" do
    assert_difference -> { @user.notification_rules.count }, 1 do
      post notifications_rules_path, params: {
        notification_rule: {
          name: "Daily Check",
          frequency: "daily",
          due_in_days: 0,
          active: true
        }
      }
    end

    assert_redirected_to notifications_rules_path
    rule = @user.notification_rules.last
    assert_equal "Daily Check", rule.name
    assert_equal "daily", rule.frequency
    assert_equal 0, rule.due_in_days
  end

  test "create rule with boards and tags" do
    tag = tags(:web)

    post notifications_rules_path, params: {
      notification_rule: {
        name: "Board & Tag Rule",
        frequency: "weekly",
        due_in_days: 7,
        board_ids: [@board.id],
        tag_ids: [tag.id]
      }
    }

    assert_redirected_to notifications_rules_path
    rule = @user.notification_rules.last
    assert_includes rule.boards, @board
    assert_includes rule.tags, tag
  end

  test "edit renders form with existing rule" do
    rule = @user.notification_rules.create!(name: "Edit Me", frequency: :daily)

    get edit_notifications_rule_path(rule)
    assert_response :success
    assert_select "input[value='Edit Me']"
  end

  test "update notification rule" do
    rule = @user.notification_rules.create!(name: "Old Name", frequency: :daily)

    patch notifications_rule_path(rule), params: {
      notification_rule: {
        name: "New Name",
        frequency: "weekly"
      }
    }

    assert_redirected_to notifications_rules_path
    rule.reload
    assert_equal "New Name", rule.name
    assert_equal "weekly", rule.frequency
  end

  test "destroy notification rule" do
    rule = @user.notification_rules.create!(name: "Delete Me", frequency: :daily)

    assert_difference -> { @user.notification_rules.count }, -1 do
      delete notifications_rule_path(rule)
    end

    assert_redirected_to notifications_rules_path
  end

  test "cannot access other user's rules" do
    other_user = users(:kevin)
    other_rule = other_user.notification_rules.create!(
      name: "Other User Rule",
      frequency: :daily,
      account: other_user.account
    )

    get edit_notifications_rule_path(other_rule)
    assert_response :not_found
  end
end
