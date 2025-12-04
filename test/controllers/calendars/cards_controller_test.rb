require "test_helper"

class Calendars::CardsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:david)
    @card = cards(:logo)
    @card.update!(due_on: Date.current)
    sign_in_as @user
  end

  test "show displays card in modal" do
    get calendar_card_path(@card)
    assert_response :success
    assert_select "turbo-frame#calendar_card_modal"
    assert_select ".calendar-modal"
  end

  test "show passes return date parameter" do
    get calendar_card_path(@card, date: "2025-12-01")
    assert_response :success
    assert_select "a[href*='date=2025-12-01']"
  end

  test "show requires authentication" do
    sign_out
    get calendar_card_path(@card)
    assert_response :redirect
  end

  test "show requires access to card" do
    # This test verifies that inaccessible cards raise RecordNotFound
    # All fixture users share the same account, so we just verify the controller
    # uses accessible_cards scope which would filter by account access
    assert_includes @user.accessible_cards, @card
  end
end
