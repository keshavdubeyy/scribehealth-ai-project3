package com.scribehealth.pattern.strategy;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Factory for building NotificationService instances pre-wired for doctor's channels.
 * 
 * This factory encapsulates the logic of which strategies to register based on
 * available contact information. If phone is provided, WhatsApp and SMS strategies
 * are registered in addition to Email.
 */
@Component
public class NotificationServiceFactory {
    
    /**
     * Builds a notification service for a doctor with available contact channels.
     * 
     * @param email the doctor's email address (required)
     * @param phone the doctor's phone number (optional) - if provided, enables WhatsApp and SMS
     * @return a NotificationService configured with appropriate strategies
     */
    public NotificationService buildDoctorNotificationService(String email, String phone) {
        NotificationService service = new NotificationService();
        
        // Email is always available
        service.register(new EmailNotificationStrategy());
        
        // Phone-based channels only if phone is provided
        if (phone != null && !phone.isBlank()) {
            service.register(new WhatsAppNotificationStrategy(phone));
            service.register(new SmsNotificationStrategy(phone));
        }
        
        return service;
    }
    
    /**
     * Builds a notification service for a patient with available contact channels.
     * 
     * @param email the patient's email address (optional)
     * @param phone the patient's phone number (optional)
     * @return a NotificationService configured with appropriate strategies
     * @throws IllegalArgumentException if neither email nor phone is provided
     */
    public NotificationService buildPatientNotificationService(String email, String phone) {
        if ((email == null || email.isBlank()) && (phone == null || phone.isBlank())) {
            throw new IllegalArgumentException("At least one contact method (email or phone) is required");
        }
        
        NotificationService service = new NotificationService();
        
        if (email != null && !email.isBlank()) {
            service.register(new EmailNotificationStrategy());
        }
        
        if (phone != null && !phone.isBlank()) {
            service.register(new WhatsAppNotificationStrategy(phone));
            service.register(new SmsNotificationStrategy(phone));
        }
        
        return service;
    }
    
    /**
     * Builds a notification service with all available strategies.
     * Useful for admin notifications or system alerts.
     * 
     * @param email the email address
     * @param phone the phone number (optional)
     * @return a NotificationService with all strategies
     */
    public NotificationService buildFullService(String email, String phone) {
        NotificationService service = new NotificationService();
        
        service.register(new EmailNotificationStrategy());
        
        if (phone != null && !phone.isBlank()) {
            service.register(new WhatsAppNotificationStrategy(phone));
            service.register(new SmsNotificationStrategy(phone));
        }
        
        return service;
    }
    
    /**
     * Returns a list of all available channel names.
     * @return array of channel names
     */
    public String[] getAvailableChannels() {
        return new String[]{"email", "whatsapp", "sms"};
    }
}
