package com.scribehealth.pattern.builder;

/**
 * Represents an emergency contact with validation.
 * Immutable value object.
 */
public class EmergencyContact {
    
    private final String name;
    private final String phone;
    private final String relationship;
    private final String email;
    
    private EmergencyContact(Builder builder) {
        this.name = builder.name;
        this.phone = builder.phone;
        this.relationship = builder.relationship;
        this.email = builder.email;
    }
    
    public String getName() {
        return name;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public String getRelationship() {
        return relationship;
    }
    
    public String getEmail() {
        return email;
    }
    
    /**
     * Validates the phone number format (10 digits, optionally with country code).
     * @return true if phone is valid
     */
    public boolean isValidPhone() {
        if (phone == null || phone.isEmpty()) {
            return false;
        }
        // Remove all non-digits and check length
        String digits = phone.replaceAll("\\D", "");
        return digits.length() >= 10;
    }
    
    @Override
    public String toString() {
        return String.format("EmergencyContact{name='%s', phone='%s', relationship='%s'}", 
                name, phone, relationship);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String name;
        private String phone;
        private String relationship;
        private String email;
        
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }
        
        public Builder relationship(String relationship) {
            this.relationship = relationship;
            return this;
        }
        
        public Builder email(String email) {
            this.email = email;
            return this;
        }
        
        public EmergencyContact build() {
            if (name == null || name.isBlank()) {
                throw new IllegalStateException("Emergency contact name is required");
            }
            if (phone == null || phone.isBlank()) {
                throw new IllegalStateException("Emergency contact phone is required");
            }
            // Validate phone format
            String digits = phone.replaceAll("\\D", "");
            if (digits.length() < 10) {
                throw new IllegalStateException("Emergency contact phone must have at least 10 digits");
            }
            return new EmergencyContact(this);
        }
    }
}
