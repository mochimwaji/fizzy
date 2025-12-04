# Script to fix cross-account taggings
# Run with: rails runner script/maintenance/fix_cross_account_taggings.rb

Tagging.includes(:tag, card: :account).find_each do |tagging|
  if tagging.tag.account_id != tagging.card.account_id
    puts "Fixing tagging #{tagging.id}: tag #{tagging.tag.title} (account #{tagging.tag.account_id}) -> card account #{tagging.card.account_id}"
    
    correct_tag = tagging.card.account.tags.find_or_create_by!(title: tagging.tag.title)
    tagging.update!(tag: correct_tag)
  end
end

puts "Done!"
