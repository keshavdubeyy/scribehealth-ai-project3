package com.scribehealth.pattern.strategy;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * WhatsApp notification strategy using wa.me URI scheme.
 * Opens WhatsApp Web or app pre-filled with the notification text.
 * 
 * Note: This is a server-side implementation that logs the notification.
 * The actual WhatsApp opening happens on the frontend.
 */
@Component
public class WhatsAppNotificationStrategy implements NotificationStrategy {
    
    private static final Logger log = LoggerFactory.getLogger(WhatsAppNotificationStrategy.class);
    
    private final String defaultPhone;
    
    public WhatsAppNotificationStrategy() {
        this.defaultPhone = null;
    }
    
    public WhatsAppNotificationStrategy(String phone) {
        // Normalize phone: remove non-digits
        this.defaultPhone = phone != null ? phone.replaceAll("\\D", "") : null;
    }
    
    @Override
    public String getChannel() {
        return "whatsapp";
    }
    
    @Override
    public void fire(NotificationPayload payload) throws NotificationException {
        try {
            String to = payload.getTo();
            // Normalize phone number
            String digits = to.replaceAll("\\D", "");
            
            // Format text with subject bolded (WhatsApp markdown)
            String text = String.format("*%s*\n\n%s", payload.getSubject(), payload.getBody());
            String encodedText = URLEncoder.encode(text, StandardCharsets.UTF_8);
            
            // Build wa.me URI
            String waUri = String.format("https://wa.me/%s?text=%s", digits, encodedText);
            
            log.info("[WHATSAPP] Notification sent to={} subject={} uri_length={}", 
                    to, payload.getSubject(), waUri.length());
            
        } catch (Exception e) {
            throw new NotificationException(getChannel(), "Failed to send WhatsApp notification", e);
        }
    }
    
    @Override
    public boolean isAvailable() {
        // WhatsApp is available if we have a phone number configured
        return defaultPhone != null && !defaultPhone.isEmpty();
    }
}
