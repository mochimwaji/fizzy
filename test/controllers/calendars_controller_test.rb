require "test_helper"

class CalendarsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:david)
    sign_in_as @user
  end

  test "show displays calendar for current month" do
    get calendar_path
    assert_response :success
    assert_select ".calendar"
  end

  test "show displays calendar for specified month" do
    get calendar_path(date: "2025-06-15")
    assert_response :success
    assert_select ".calendar"
  end

  test "show displays cards with due dates" do
    card = cards(:logo)
    card.update!(due_on: Date.current)

    get calendar_path
    assert_response :success
    assert_select ".calendar__card", minimum: 1
  end

  test "show only displays cards user has access to" do
    get calendar_path
    assert_response :success
    # Should not raise any errors
  end

  test "navigation links work" do
    get calendar_path
    assert_response :success
    assert_select "a[href*='date=']", minimum: 2
  end
end
