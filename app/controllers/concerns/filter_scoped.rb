module FilterScoped
  extend ActiveSupport::Concern

  included do
    before_action :set_filter
    before_action :set_user_filtering
  end

  class_methods do
    def enable_collection_filtering(**options)
      before_action :enable_collection_filtering, **options
    end
  end

  private
    DEFAULT_PARAMS = { indexed_by: "all", sorted_by: "latest" }

    def set_filter
      if params[:filter_id].present?
        @filter = Current.user.filters.find(params[:filter_id])
      else
        @filter = Current.user.filters.from_params params.reverse_merge(**DEFAULT_PARAMS).permit(*Filter::PERMITTED_PARAMS)
      end
    end

    def set_user_filtering
      @user_filtering = User::Filtering.new(Current.user, @filter, expanded: expanded_param)
    end

    def expanded_param
      ActiveRecord::Type::Boolean.new.cast(params[:expand_all])
    end

    def enable_collection_filtering
      # We pass a block so that we don't have to pass around the script_name and host
      # to the model to make +url_for+ invocable
      @user_filtering.enable_collection_filtering do |**options|
        url_for(options)
      end
    end
end
