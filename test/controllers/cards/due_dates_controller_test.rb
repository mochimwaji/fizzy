require "test_helper"

class Cards::DueDatesControllerTest < ActionDispatch::IntegrationTest
  setup do
    sign_in_as :kevin
  end

  test "new" do
    card = cards(:logo)
    get new_card_due_date_path(card)
    assert_response :success
  end

  test "create sets due date" do
    card = cards(:logo)
    with_current_user(users(:kevin)) do
      card.update!(due_on: nil)
    end

    due_date = 1.week.from_now.to_date

    assert_changes -> { card.reload.due_on }, from: nil, to: due_date do
      post card_due_date_path(card), params: { due_date: { due_on: due_date } }, as: :turbo_stream
      assert_response :success
    end
  end

  test "create updates existing due date" do
    card = cards(:logo)
    old_date = Date.current
    new_date = 1.week.from_now.to_date
    with_current_user(users(:kevin)) do
      card.update!(due_on: old_date)
    end

    assert_changes -> { card.reload.due_on }, from: old_date, to: new_date do
      post card_due_date_path(card), params: { due_date: { due_on: new_date } }, as: :turbo_stream
      assert_response :success
    end
  end

  test "destroy removes due date" do
    card = cards(:logo)
    due_date = Date.tomorrow
    with_current_user(users(:kevin)) do
      card.update!(due_on: due_date)
    end

    assert_changes -> { card.reload.due_on }, from: due_date, to: nil do
      delete card_due_date_path(card), as: :turbo_stream
      assert_response :success
    end
  end

  test "create fires event" do
    card = cards(:logo)
    with_current_user(users(:kevin)) do
      card.update!(due_on: nil)
    end

    assert_difference -> { card.events.count }, +1 do
      post card_due_date_path(card), params: { due_date: { due_on: Date.tomorrow } }, as: :turbo_stream
    end

    assert_equal "card_due_date_set", card.events.last.action
  end

  test "destroy fires event" do
    card = cards(:logo)
    with_current_user(users(:kevin)) do
      card.update!(due_on: Date.current)
    end

    assert_difference -> { card.events.count }, +1 do
      delete card_due_date_path(card), as: :turbo_stream
    end

    assert_equal "card_due_date_removed", card.events.last.action
  end
end
