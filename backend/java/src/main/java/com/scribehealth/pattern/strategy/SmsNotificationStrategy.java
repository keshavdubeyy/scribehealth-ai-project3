package com.scribehealth.pattern.strategy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * SMS notification strategy using sms: URI scheme.
 * Opens the native SMS app pre-filled with the notification.
 * 
 * Note: This is a server-side implementation that logs the notification.
 * The actual SMS app opening happens on the frontend.
 */
@Component
public class SmsNotificationStrategy implements NotificationStrategy {
    
    private static final Logger log = LoggerFactory.getLogger(SmsNotificationStrategy.class);
    
    private final String defaultPhone;
    
    public SmsNotificationStrategy() {
        this.defaultPhone = null;
    }
    
    public SmsNotificationStrategy(String phone) {
        this.defaultPhone = phone;
    }
    
    @Override
    public String getChannel() {
        return "sms";
    }
    
    @Override
    public void fire(NotificationPayload payload) throws NotificationException {
        try {
            String to = payload.getTo();
            // Format text
            String text = String.format("%s\n\n%s", payload.getSubject(), payload.getBody());
            String encodedText = URLEncoder.encode(text, StandardCharsets.UTF_8);
            
            // Build sms: URI
            String smsUri = String.format("sms:%s?body=%s", to, encodedText);
            
            log.info("[SMS] Notification sent to={} subject={} uri_length={}", 
                    to, payload.getSubject(), smsUri.length());
            
        } catch (Exception e) {
            throw new NotificationException(getChannel(), "Failed to send SMS notification", e);
        }
    }
    
    @Override
    public boolean isAvailable() {
        // SMS is available if we have a phone number configured
        return defaultPhone != null && !defaultPhone.isEmpty();
    }
}
