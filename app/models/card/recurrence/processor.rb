class Card::Recurrence::Processor
  def initialize(recurrence)
    @recurrence = recurrence
    @template_card = recurrence.card
  end

  def process
    new_card = create_card_from_template
    update_recurrence_timing

    new_card
  end

  private

  def create_card_from_template
    Current.user = @template_card.creator

    new_card = @template_card.board.cards.create!(
      title: @template_card.title,
      creator: @template_card.creator,
      account: @template_card.account
    )

    # Copy description if present
    if @template_card.description.present?
      new_card.description = @template_card.description.body
      new_card.save!
    end

    # Copy tags
    @template_card.tags.each do |tag|
      new_card.toggle_tag_with(tag.title)
    end

    # Copy assignees
    @template_card.assignees.each do |assignee|
      new_card.assignments.create!(assignee: assignee, assigner: @template_card.creator)
    rescue ActiveRecord::RecordNotUnique
      # Already assigned
    end

    # Copy steps (unchecked)
    @template_card.steps.each do |step|
      new_card.steps.create!(content: step.content, completed: false, account: new_card.account)
    end

    # Set due date if template has one (relative to today)
    if @template_card.due_on.present?
      days_offset = @template_card.due_on - @template_card.created_at.to_date
      new_card.set_due_date(Date.current + days_offset.days)
    end

    # Publish the card
    new_card.publish!

    new_card
  end

  def update_recurrence_timing
    @recurrence.update!(
      last_occurred_at: Time.current
    )
    @recurrence.calculate_and_save_next_occurrence!
  end
end
