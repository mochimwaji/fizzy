# Production seed: Initialize external_account_id sequence to 7+ digits
# This ensures new accounts get IDs like 1000001, 1000002, etc.

if Account::ExternalIdSequence.count == 0
  Account::ExternalIdSequence.create!(value: 1_000_000)
  puts "Initialized external_account_id sequence to 1000000"
else
  puts "External account ID sequence already initialized"
end
