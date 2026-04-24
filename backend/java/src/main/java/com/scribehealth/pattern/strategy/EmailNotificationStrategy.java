package com.scribehealth.pattern.strategy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Email notification strategy using mailto: URI scheme.
 * Opens the system email client pre-filled with the notification.
 * 
 * Note: This is a server-side implementation that logs the notification.
 * The actual email client opening happens on the frontend.
 */
@Component
public class EmailNotificationStrategy implements NotificationStrategy {
    
    private static final Logger log = LoggerFactory.getLogger(EmailNotificationStrategy.class);
    
    @Override
    public String getChannel() {
        return "email";
    }
    
    @Override
    public void fire(NotificationPayload payload) throws NotificationException {
        try {
            String to = payload.getTo();
            String subject = URLEncoder.encode(payload.getSubject(), StandardCharsets.UTF_8);
            String body = URLEncoder.encode(payload.getBody(), StandardCharsets.UTF_8);
            
            // Build mailto URI
            String mailtoUri = String.format("mailto:%s?subject=%s&body=%s", to, subject, body);
            
            log.info("[EMAIL] Notification sent to={} subject={} uri_length={}", 
                    to, payload.getSubject(), mailtoUri.length());
            
            // In a real implementation, you might:
            // - Queue the email for async sending via SMTP
            // - Store in database for tracking
            // - Trigger webhook for external email service
            
        } catch (Exception e) {
            throw new NotificationException(getChannel(), "Failed to send email notification", e);
        }
    }
    
    @Override
    public boolean isAvailable() {
        // Email is always available (mailto: scheme works universally)
        return true;
    }
}
