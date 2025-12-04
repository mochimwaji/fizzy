require "test_helper"

class Cards::RecurrencesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:david)
    sign_in_as @user
    @card = cards(:shipping) # use a card without existing recurrence
  end

  test "new renders recurrence form" do
    get new_card_recurrence_path(@card)
    assert_response :success
  end

  test "create sets up a new recurrence" do
    assert_difference -> { Card::Recurrence.count }, 1 do
      post card_recurrence_path(@card), params: {
        recurrence: {
          frequency: "weekly",
          day_of_week: "1"
        }
      }
    end

    assert @card.reload.recurring?
    assert_equal "weekly", @card.recurrence.frequency
    assert_equal 1, @card.recurrence.day_of_week
  end

  test "update modifies existing recurrence" do
    @card.setup_recurrence(frequency: :daily)

    patch card_recurrence_path(@card), params: {
      recurrence: {
        frequency: "weekly",
        day_of_week: "3",
        active: "1"
      }
    }

    @card.reload
    assert_equal "weekly", @card.recurrence.frequency
    assert_equal 3, @card.recurrence.day_of_week
  end

  test "destroy removes recurrence" do
    @card.setup_recurrence(frequency: :daily)

    assert_difference -> { Card::Recurrence.count }, -1 do
      delete card_recurrence_path(@card)
    end

    assert_not @card.reload.recurring?
  end

  test "update can pause recurrence" do
    @card.setup_recurrence(frequency: :daily)

    patch card_recurrence_path(@card), params: {
      recurrence: {
        frequency: "daily",
        active: "0"
      }
    }

    assert_not @card.reload.recurrence.active?
  end
end
