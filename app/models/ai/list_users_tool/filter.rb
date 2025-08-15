class Ai::ListUsersTool::Filter < Ai::Tool::Filter
  register_filter :ids, :apply_ids_filter

  private
    def apply_ids_filter(scope)
      scope.where(id: filters[:ids].split(",").map(&:strip))
    end
end
