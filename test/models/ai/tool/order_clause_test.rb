require "test_helper"

class Ai::Tool::OrderClauseTest < ActiveSupport::TestCase
  test "parsing" do
    order_clause = Ai::Tool::OrderClause.parse("created_at DESC")
    assert_equal({ "created_at" => :desc }, order_clause.order, "Parses a single column and direction")

    order_clause = Ai::Tool::OrderClause.parse("created_at DESC, id ASC")
    assert_equal({ "created_at" => :desc, "id" => :asc }, order_clause.order, "Parses a multiple column and direction")
    assert_equal(%w[created_at id], order_clause.order.keys, "Preserves the order of columns")

    order_clause = Ai::Tool::OrderClause.parse("id desc, created_at AsC")
    assert_equal({ "created_at" => :asc, "id" => :desc }, order_clause.order, "Parses the direction regardless of case")
    assert_equal(%w[id created_at], order_clause.order.keys, "Preserves the order of columns")

    # Raises if the direction is invalid
    assert_raises(ArgumentError) do
      Ai::Tool::OrderClause.parse("id foo")
    end

    # raises if the direction is missing
    assert_raises(ArgumentError) do
      Ai::Tool::OrderClause.parse("id")
    end
  end

  test "defaults" do
    order_clause = Ai::Tool::OrderClause.parse(
      "created_at DESC",
      defaults: { id: :desc },
      permitted_columns: %i[created_at id]
    )

    assert_equal({ "created_at" => :desc, "id" => :desc }, order_clause.to_h, "Defaults get applied last")

    order_clause = Ai::Tool::OrderClause.parse(
      "id DESC",
      defaults: { id: :asc },
      permitted_columns: %i[id]
    )

    assert_equal({ "id" => :desc }, order_clause.to_h, "Defaults don't override set values")
  end

  test "permitted columns" do
    order_clause = Ai::Tool::OrderClause.parse(
      "id DESC, created_at ASC",
      permitted_columns: %i[id]
    )

    assert_equal({ "id" => :desc }, order_clause.to_h, "Returns only permitted columns")
  end
end
