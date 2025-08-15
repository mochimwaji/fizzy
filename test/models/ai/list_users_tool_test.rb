require "test_helper"

class Ai::ListUsersToolTest < ActiveSupport::TestCase
  include McpHelper

  setup do
    @tool = Ai::ListUsersTool.new(user: users(:kevin))
  end

  test "execute" do
    response = @tool.execute(collection_id: collections(:writebook).id)
    page = parse_paginated_response(response)

    assert page[:records].is_a?(Array)

    assert_raises(ActiveRecord::RecordNotFound) do
      @tool.execute
    end
  end

  test "execute when filtering by ids" do
    users = users(:david, :jz)
    user_ids = users.pluck(:id)

    response = @tool.execute(collection_id: collections(:writebook).id, ids: user_ids.join(", "))
    page = parse_paginated_response(response)
    record_ids = page[:records].map { |user| user["id"].to_i }

    assert_equal 2, record_ids.count
    assert_equal user_ids.sort, record_ids.sort
  end
end
