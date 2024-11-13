module Filter::Fields
  extend ActiveSupport::Concern

  INDEXES = %w[ most_discussed most_boosted newest oldest popped ]

  class_methods do
    def default_fields
      { indexed_by: "most_active" }
    end
  end

  included do
    store_accessor :fields, :indexed_by, :assignments, :terms

    def indexed_by
      (super || default_fields[:indexed_by]).inquiry
    end

    def assignments
      super.to_s.inquiry
    end

    def terms
      Array(super)
    end
  end

  private
    delegate :default_fields, to: :class, private: true
end
