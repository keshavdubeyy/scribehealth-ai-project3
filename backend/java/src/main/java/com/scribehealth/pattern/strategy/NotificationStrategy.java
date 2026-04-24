package com.scribehealth.pattern.strategy;

/**
 * FR-12 + FR-09: Stakeholder notification via Strategy pattern.
 *
 * NotificationStrategy is the common interface.
 * EmailNotificationStrategy, WhatsAppNotificationStrategy, and SmsNotificationStrategy
 * are interchangeable concrete implementations — new channels (Slack, push, etc.)
 * require only a new class; the service and callers are untouched.
 *
 * NotificationService holds a registered list of strategies and fans out
 * every event to all of them in one call.
 */
public interface NotificationStrategy {
    
    /**
     * Returns the channel name for this strategy.
     * @return channel identifier (e.g., "email", "whatsapp", "sms")
     */
    String getChannel();
    
    /**
     * Sends a notification via this channel.
     * 
     * @param payload the notification payload containing recipient, subject, and body
     * @throws NotificationException if sending fails
     */
    void fire(NotificationPayload payload) throws NotificationException;
    
    /**
     * Checks if this strategy is properly configured and can send notifications.
     * @return true if the strategy is available
     */
    boolean isAvailable();
}
