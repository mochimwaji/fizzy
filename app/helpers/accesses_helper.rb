module AccessesHelper
  def access_toggles_for(users, selected:)
    render partial: "buckets/access_toggle",
      collection: users, as: :user,
      locals: { selected: selected },
      cached: ->(user) { [ user, selected ] }
  end

  def access_toggle_tag(user, &)
    tag.li class: "flex align-center gap-half margin-none unpad", data: {
      value: user.name.downcase,
      creator_id: user.id,
      controller: "created-by-current-user",
      created_by_current_user_target: "creation",
      created_by_current_user_mine_class: "toggler--toggled" }, &
  end
end
