package com.scribehealth.pattern.strategy;

/**
 * Payload for notification strategies.
 */
public class NotificationPayload {
    
    private final String to;        // email address or phone number depending on strategy
    private final String subject;
    private final String body;
    private final String sessionId; // optional session reference
    private final String patientName; // optional patient name for context
    
    public NotificationPayload(String to, String subject, String body) {
        this(to, subject, body, null, null);
    }
    
    public NotificationPayload(String to, String subject, String body, String sessionId, String patientName) {
        this.to = to;
        this.subject = subject;
        this.body = body;
        this.sessionId = sessionId;
        this.patientName = patientName;
    }
    
    public String getTo() {
        return to;
    }
    
    public String getSubject() {
        return subject;
    }
    
    public String getBody() {
        return body;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public String getPatientName() {
        return patientName;
    }
    
    /**
     * Builder for creating notification payloads with lifecycle templates.
     */
    public static class Builder {
        private String to;
        private String subject;
        private String body;
        private String sessionId;
        private String patientName;
        
        public Builder to(String to) {
            this.to = to;
            return this;
        }
        
        public Builder subject(String subject) {
            this.subject = subject;
            return this;
        }
        
        public Builder body(String body) {
            this.body = body;
            return this;
        }
        
        public Builder sessionId(String sessionId) {
            this.sessionId = sessionId;
            return this;
        }
        
        public Builder patientName(String patientName) {
            this.patientName = patientName;
            return this;
        }
        
        public NotificationPayload build() {
            if (to == null || to.isBlank()) {
                throw new IllegalArgumentException("Recipient (to) is required");
            }
            if (subject == null || subject.isBlank()) {
                throw new IllegalArgumentException("Subject is required");
            }
            if (body == null || body.isBlank()) {
                throw new IllegalArgumentException("Body is required");
            }
            return new NotificationPayload(to, subject, body, sessionId, patientName);
        }
        
        // Template methods for lifecycle events
        
        public NotificationPayload noteReady() {
            if (patientName == null || sessionId == null) {
                throw new IllegalStateException("patientName and sessionId required for noteReady template");
            }
            this.subject = String.format("[ScribeHealth] Note ready for review — %s", patientName);
            this.body = String.join("\n", new String[]{
                String.format("Your AI-generated clinical note for %s is ready for review.", patientName),
                "",
                String.format("Session ID: %s", sessionId),
                "",
                "Please log in to ScribeHealth AI to review, edit, and approve the note before it enters the permanent record.",
                "",
                "---",
                "ScribeHealth AI — automated lifecycle notification"
            });
            return build();
        }
        
        public NotificationPayload noteApproved() {
            if (patientName == null || sessionId == null) {
                throw new IllegalStateException("patientName and sessionId required for noteApproved template");
            }
            this.subject = String.format("[ScribeHealth] Note approved — %s", patientName);
            this.body = String.join("\n", new String[]{
                String.format("The clinical note for %s has been approved and locked.", patientName),
                "",
                String.format("Session ID: %s", sessionId),
                "",
                "The note is now part of the permanent medical record and cannot be edited.",
                "",
                "---",
                "ScribeHealth AI — automated lifecycle notification"
            });
            return build();
        }
        
        public NotificationPayload noteRejected() {
            if (patientName == null || sessionId == null) {
                throw new IllegalStateException("patientName and sessionId required for noteRejected template");
            }
            this.subject = String.format("[ScribeHealth] Note rejected — %s", patientName);
            this.body = String.join("\n", new String[]{
                String.format("The AI-generated note for %s has been rejected and flagged for regeneration.", patientName),
                "",
                String.format("Session ID: %s", sessionId),
                "",
                "Please log in to ScribeHealth AI and use the \"Regenerate note\" button to create a new draft.",
                "",
                "---",
                "ScribeHealth AI — automated lifecycle notification"
            });
            return build();
        }
    }
}
