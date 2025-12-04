# SMTP configuration for production email delivery
# Set these environment variables:
#   SMTP_ADDRESS, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_DOMAIN
#   MAILER_FROM (optional, defaults to noreply@SMTP_DOMAIN)

if Rails.env.production? && ENV["SMTP_ADDRESS"].present?
  Rails.application.config.action_mailer.delivery_method = :smtp
  Rails.application.config.action_mailer.perform_deliveries = true

  Rails.application.config.action_mailer.smtp_settings = {
    address: ENV["SMTP_ADDRESS"],
    port: ENV.fetch("SMTP_PORT", 587).to_i,
    user_name: ENV["SMTP_USERNAME"],
    password: ENV["SMTP_PASSWORD"],
    domain: ENV["SMTP_DOMAIN"],
    authentication: ENV.fetch("SMTP_AUTHENTICATION", "login").to_sym,
    enable_starttls_auto: ENV.fetch("SMTP_STARTTLS", "true") == "true",
    open_timeout: 5,
    read_timeout: 5
  }

  # Set default URL host for links in emails
  if ENV["MAILER_HOST"].present?
    Rails.application.config.action_mailer.default_url_options = { host: ENV["MAILER_HOST"] }
  end
end
