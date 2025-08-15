require "test_helper"

class Ai::ListCollectionsToolTest < ActiveSupport::TestCase
  include McpHelper

  setup do
    @tool = Ai::ListCollectionsTool.new(user: users(:kevin))
  end

  test "execute" do
    response = @tool.execute
    page = parse_paginated_response(response)

    assert page[:records].is_a?(Array)
  end

  test "execute when filtering by ids" do
    collections = collections(:writebook, :private)
    collection_ids = collections.pluck(:id)

    response = @tool.execute(ids: collection_ids.join(", "))
    page = parse_paginated_response(response)
    record_ids = page[:records].map { |collection| collection["id"].to_i }

    assert_equal 2, record_ids.count
    assert_equal collection_ids.sort, record_ids.sort
  end
end
