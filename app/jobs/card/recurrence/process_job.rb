class Card::Recurrence::ProcessJob < ApplicationJob
  queue_as :default

  def perform
    Card::Recurrence.due.find_each do |recurrence|
      Current.account = recurrence.account
      recurrence.process!
    rescue => e
      Rails.logger.error "Failed to process recurrence #{recurrence.id}: #{e.message}"
    end
  end
end
