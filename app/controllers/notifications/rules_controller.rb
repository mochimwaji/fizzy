class Notifications::RulesController < ApplicationController
  before_action :set_notification_rule, only: [:show, :edit, :update, :destroy]

  def index
    @notification_rules = Current.user.notification_rules.includes(:boards, :tags)
  end

  def show
  end

  def new
    @notification_rule = Current.user.notification_rules.build
  end

  def create
    @notification_rule = Current.user.notification_rules.build(notification_rule_params)

    if @notification_rule.save
      redirect_to notifications_rules_path, notice: "Notification rule created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @notification_rule.update(notification_rule_params)
      redirect_to notifications_rules_path, notice: "Notification rule updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @notification_rule.destroy
    redirect_to notifications_rules_path, notice: "Notification rule deleted."
  end

  private
    def set_notification_rule
      @notification_rule = Current.user.notification_rules.find(params[:id])
    end

    def notification_rule_params
      params.require(:notification_rule).permit(:name, :frequency, :due_in_days, :active, board_ids: [], tag_ids: [])
    end
end
