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
    prev_col = adjacent_column(column, :prev)
    prev_col ? board_column_path(column.board, prev_col) : nil
  end

  def next_column_path(column)
    next_col = adjacent_column(column, :next)
    next_col ? board_column_path(column.board, next_col) : nil
  end

  def column_position_label(column)
    columns = column.board.columns.sorted.to_a
    current_index = columns.index(column)
    return "" unless current_index
    "#{current_index + 1} of #{columns.length}"
  end
end
