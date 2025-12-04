class CalendarsController < ApplicationController
  def show
    @date = parse_date(params[:date]) || Date.current
    @start_date = @date.beginning_of_month.beginning_of_week(:sunday)
    @end_date = @date.end_of_month.end_of_week(:sunday)

    @cards_by_date = cards_with_due_dates.group_by(&:due_on)
  end

  private

  def parse_date(date_string)
    return nil if date_string.blank?
    Date.parse(date_string)
  rescue ArgumentError
    nil
  end

  def cards_with_due_dates
    Current.user.accessible_cards
      .with_due_date
      .open
      .where(due_on: @start_date..@end_date)
      .preloaded
  end
end
