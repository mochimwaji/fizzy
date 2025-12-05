module BoardsHelper
  def link_back_to_board(board)
    back_link_to board.name, board, "keydown.left@document->hotkey#click keydown.esc@document->hotkey#click click->turbo-navigation#backIfSamePath"
  end

  def link_to_edit_board(board)
    link_to edit_board_path(board), class: "btn", data: { controller: "tooltip" } do
      icon_tag("settings") + tag.span("Settings for #{board.name}", class: "for-screen-reader")
    end
  end

  # Mobile column navigation helpers
  # Defines the full ordered list of "columns" including special ones
  # Order: Not Now, Maybe?, [custom columns...], Done
  SPECIAL_COLUMNS = [ :not_now, :stream, :closed ].freeze

  def all_column_items(board)
    items = []
    
    # Not Now first
    items << { type: :not_now, name: "Not Now", path: board_columns_not_now_path(board) }
    
    # Maybe? (stream)
    items << { type: :stream, name: "Maybe?", path: board_columns_stream_path(board) }
    
    # Custom columns in sorted order
    board.columns.sorted.each do |column|
      items << { type: :column, column: column, name: column.name, path: board_column_path(board, column) }
    end
    
    # Done last
    items << { type: :closed, name: "Done", path: board_columns_closed_path(board) }
    
    items
  end

  def find_column_index(board, current_type, current_column = nil)
    items = all_column_items(board)
    items.each_with_index do |item, index|
      if current_type == :column && item[:type] == :column && item[:column] == current_column
        return index
      elsif item[:type] == current_type && current_type != :column
        return index
      end
    end
    nil
  end

  def adjacent_column_item(board, current_type, current_column, direction)
    items = all_column_items(board)
    current_index = find_column_index(board, current_type, current_column)
    return nil unless current_index

    case direction
    when :prev
      current_index > 0 ? items[current_index - 1] : nil
    when :next
      current_index < items.length - 1 ? items[current_index + 1] : nil
    end
  end

  def prev_column_item(board, current_type, current_column = nil)
    adjacent_column_item(board, current_type, current_column, :prev)
  end

  def next_column_item(board, current_type, current_column = nil)
    adjacent_column_item(board, current_type, current_column, :next)
  end

  def column_position_label_for(board, current_type, current_column = nil)
    items = all_column_items(board)
    current_index = find_column_index(board, current_type, current_column)
    return "" unless current_index
    "#{current_index + 1} of #{items.length}"
  end

  # Legacy helpers for regular columns (still used by regular column view)
  def adjacent_column(column, direction)
    columns = column.board.columns.sorted.to_a
    current_index = columns.index(column)
    return nil unless current_index

    case direction
    when :prev
      current_index > 0 ? columns[current_index - 1] : nil
    when :next
      current_index < columns.length - 1 ? columns[current_index + 1] : nil
    end
  end

  def prev_column_path(column)
    item = prev_column_item(column.board, :column, column)
    item ? item[:path] : nil
  end

  def next_column_path(column)
    item = next_column_item(column.board, :column, column)
    item ? item[:path] : nil
  end

  def column_position_label(column)
    column_position_label_for(column.board, :column, column)
  end
end
