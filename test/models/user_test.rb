require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "create" do
    user = User.create! \
      role: "member",
      name: "Victor Cooper",
      email_address: "victor@hey.com",
      password: "secret123456"

    assert_equal user, User.authenticate_by(email_address: "victor@hey.com", password: "secret123456")
  end

  test "creation gives access to all_access collections" do
    user = User.create! \
      role: "member",
      name: "Victor Cooper",
      email_address: "victor@hey.com",
      password: "secret123456"

    assert_equal [ collections(:writebook) ], user.collections
  end

  test "deactivate" do
    users(:jz).sessions.create!

    assert_changes -> { users(:jz).active? }, from: true, to: false do
      assert_changes -> { users(:jz).accesses.count }, from: 1, to: 0 do
        assert_changes -> { users(:jz).sessions.count }, from: 1, to: 0 do
          users(:jz).deactivate
        end
      end
    end
    assert_nil users(:jz).reload.signal_user
  end

  test "initials" do
    assert_equal "JF", User.new(name: "jason fried").initials
    assert_equal "DHH", User.new(name: "David Heinemeier Hansson").initials
    assert_equal "ÉLH", User.new(name: "Éva-Louise Hernández").initials
  end

  test "system user" do
    system_user = User.system

    assert system_user.system?
    assert_equal "System", system_user.name
    assert_equal "S", system_user.initials

    assert_not_includes User.active, system_user
  end

  test "start or continue conversation" do
    user = users(:jz)

    assert_nil user.conversation

    conversation = user.start_or_continue_conversation

    assert user.conversation
    assert_equal user.conversation, conversation
  end

  test "AI quota" do
    user = users(:jz)

    assert_nil user.ai_quota
    quota = user.fetch_or_create_ai_quota
    assert user.ai_quota
    assert_equal user.ai_quota, quota
  end
end
