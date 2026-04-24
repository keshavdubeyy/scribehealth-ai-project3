package com.scribehealth.pattern.strategy;

/**
 * Exception thrown when notification fails.
 */
public class NotificationException extends Exception {
    
    private final String channel;
    
    public NotificationException(String message) {
        super(message);
        this.channel = "unknown";
    }
    
    public NotificationException(String channel, String message) {
        super(String.format("Notification failed for channel '%s': %s", channel, message));
        this.channel = channel;
    }
    
    public NotificationException(String channel, String message, Throwable cause) {
        super(String.format("Notification failed for channel '%s': %s", channel, message), cause);
        this.channel = channel;
    }
    
    public String getChannel() {
        return channel;
    }
}
