require "test_helper"

class Ai::ListCommentsToolTest < ActiveSupport::TestCase
  include McpHelper

  setup do
    @tool = Ai::ListCommentsTool.new(user: users(:kevin))
  end

  test "execute" do
    response = @tool.execute
    page = parse_paginated_response(response)

    assert page[:records].is_a?(Array)
  end

  test "execute when ordering the result" do
    response = @tool.execute(ordered_by: "id ASC")
    page = parse_paginated_response(response)
    ids = page[:records].map { |comment| comment["id"] }

    assert_equal ids.sort, ids, "The IDs are sorted in ascending order"

    response = @tool.execute(ordered_by: "id DESC")
    page = parse_paginated_response(response)
    ids = page[:records].map { |comment| comment["id"] }

    assert_equal ids.sort.reverse, ids, "The IDs are sorted in descending order"

    assert_raises(ArgumentError) do
      @tool.execute(ordered_by: "created_at foobar")
    end
  end

  test "execute when filtering by ids" do
    comments = comments(:logo_1, :logo_3)
    comment_ids = comments.pluck(:id)

    response = @tool.execute(ids: comment_ids.join(", "))
    page = parse_paginated_response(response)
    record_ids = page[:records].map { |comment| comment["id"].to_i }

    assert_equal 2, record_ids.count
    assert_equal comment_ids.sort, record_ids.sort
  end

  test "execute when filtering by card_ids" do
    card = cards(:logo)

    response = @tool.execute(card_ids: card.id.to_s)
    page = parse_paginated_response(response)

    assert page[:records].all? { |comment| card.id == comment["card_id"] }
  end

  test "execute when filtering by type" do
    response = @tool.execute(type: "system")
    page = parse_paginated_response(response)

    assert page[:records].all? { |comment| comment["system"] == true }

    response = @tool.execute(type: "user")
    page = parse_paginated_response(response)

    assert page[:records].all? { |comment| comment["system"] == false }
  end

  test "execute when filtering by created_at" do
    response = @tool.execute(created_after: 8.days.ago.to_s)
    page = parse_paginated_response(response)

    assert_not_empty page[:records], "There are comments created in the last 8 days"

    response = @tool.execute(created_after: 3.days.ago.to_s)
    page = parse_paginated_response(response)

    assert_not_empty page[:records], "There are comments created in the last 3 days"

    response = @tool.execute(created_before: 3.days.ago.to_s)
    page = parse_paginated_response(response)

    assert_not_empty page[:records], "There are comments created more than 3 days ago"

    response = @tool.execute(created_before: 8.days.ago.to_s)
    page = parse_paginated_response(response)

    assert_empty page[:records], "There are no comments created more than 8 days ago"

    response = @tool.execute(created_before: 3.days.ago.to_s, created_after: 8.days.ago.to_s)
    page = parse_paginated_response(response)

    assert_not_empty page[:records], "There are comments created between 3 and 8 days ago"
  end
end
