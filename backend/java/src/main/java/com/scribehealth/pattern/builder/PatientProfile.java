package com.scribehealth.pattern.builder;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Patient Profile Builder Pattern
 * 
 * A patient record is not a single form. It is a complex object assembled from 
 * many optional, domain-validated parts.
 * 
 * Patient profiles support deeply nested, optional components:
 * - Chronic Conditions - optional list, validated against known ICD codes
 * - Allergies - optional list with severity metadata
 * - Emergency Contact - name and phone, validated at build time
 * - Insurance Details - optional structured block
 * 
 * The builder enforces step-by-step, validated construction so no partially-initialized 
 * records reach the database.
 * 
 * Design Pattern: Builder Pattern - PatientProfileBuilder with fluent API and a 
 * terminal build() that runs all validations before returning the immutable PatientProfile.
 */
public class PatientProfile {
    
    // Required fields
    private final String id;
    private final String doctorEmail;
    private final String name;
    private final int age;
    private final String gender;
    private final Instant createdAt;
    
    // Optional fields
    private final String email;
    private final String phone;
    private final String organizationId;
    
    // Complex nested objects
    private final List<ChronicCondition> chronicConditions;
    private final List<Allergy> allergies;
    private final EmergencyContact emergencyContact;
    private final InsuranceDetails insuranceDetails;
    
    private PatientProfile(Builder builder) {
        this.id = builder.id;
        this.doctorEmail = builder.doctorEmail;
        this.name = builder.name;
        this.age = builder.age;
        this.gender = builder.gender;
        this.createdAt = builder.createdAt;
        this.email = builder.email;
        this.phone = builder.phone;
        this.organizationId = builder.organizationId;
        this.chronicConditions = builder.chronicConditions != null 
            ? List.copyOf(builder.chronicConditions) 
            : List.of();
        this.allergies = builder.allergies != null 
            ? List.copyOf(builder.allergies) 
            : List.of();
        this.emergencyContact = builder.emergencyContact;
        this.insuranceDetails = builder.insuranceDetails;
    }
    
    // Getters for all fields
    public String getId() { return id; }
    public String getDoctorEmail() { return doctorEmail; }
    public String getName() { return name; }
    public int getAge() { return age; }
    public String getGender() { return gender; }
    public Instant getCreatedAt() { return createdAt; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getOrganizationId() { return organizationId; }
    public List<ChronicCondition> getChronicConditions() { return chronicConditions; }
    public List<Allergy> getAllergies() { return allergies; }
    public EmergencyContact getEmergencyContact() { return emergencyContact; }
    public InsuranceDetails getInsuranceDetails() { return insuranceDetails; }
    
    /**
     * Checks if patient has any severe allergies.
     * @return true if any allergy is severe or life-threatening
     */
    public boolean hasSevereAllergies() {
        return allergies.stream().anyMatch(Allergy::isSevere);
    }
    
    /**
     * Checks if patient has valid insurance.
     * @return true if insurance details are present and valid
     */
    public boolean hasValidInsurance() {
        if (insuranceDetails == null) {
            return false;
        }
        String today = java.time.LocalDate.now().toString();
        return insuranceDetails.isValid(today);
    }
    
    /**
     * Checks if patient has an emergency contact.
     * @return true if emergency contact is present
     */
    public boolean hasEmergencyContact() {
        return emergencyContact != null;
    }
    
    @Override
    public String toString() {
        return String.format("PatientProfile{id='%s', name='%s', age=%d, gender='%s', conditions=%d, allergies=%d}",
                id, name, age, gender, chronicConditions.size(), allergies.size());
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    /**
     * Builder for PatientProfile with fluent API and validation.
     * 
     * The builder enforces step-by-step, validated construction so no 
     * partially-initialized records reach the database.
     */
    public static class Builder {
        // Required fields
        private String id;
        private String doctorEmail;
        private String name;
        private Integer age;
        private String gender;
        private Instant createdAt;
        
        // Optional fields
        private String email;
        private String phone;
        private String organizationId;
        
        // Complex nested objects
        private List<ChronicCondition> chronicConditions = new ArrayList<>();
        private List<Allergy> allergies = new ArrayList<>();
        private EmergencyContact emergencyContact;
        private InsuranceDetails insuranceDetails;
        
        // Required field setters
        public Builder id(String id) {
            this.id = id;
            return this;
        }
        
        public Builder doctorEmail(String doctorEmail) {
            this.doctorEmail = doctorEmail;
            return this;
        }
        
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder age(int age) {
            this.age = age;
            return this;
        }
        
        public Builder gender(String gender) {
            this.gender = gender;
            return this;
        }
        
        public Builder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }
        
        // Optional field setters
        public Builder email(String email) {
            this.email = email;
            return this;
        }
        
        public Builder phone(String phone) {
            this.phone = phone;
            return this;
        }
        
        public Builder organizationId(String organizationId) {
            this.organizationId = organizationId;
            return this;
        }
        
        // Complex object setters
        public Builder addChronicCondition(ChronicCondition condition) {
            if (condition != null) {
                this.chronicConditions.add(condition);
            }
            return this;
        }
        
        public Builder chronicConditions(List<ChronicCondition> conditions) {
            this.chronicConditions = conditions != null ? new ArrayList<>(conditions) : new ArrayList<>();
            return this;
        }
        
        public Builder addAllergy(Allergy allergy) {
            if (allergy != null) {
                this.allergies.add(allergy);
            }
            return this;
        }
        
        public Builder allergies(List<Allergy> allergies) {
            this.allergies = allergies != null ? new ArrayList<>(allergies) : new ArrayList<>();
            return this;
        }
        
        public Builder emergencyContact(EmergencyContact emergencyContact) {
            this.emergencyContact = emergencyContact;
            return this;
        }
        
        public Builder insuranceDetails(InsuranceDetails insuranceDetails) {
            this.insuranceDetails = insuranceDetails;
            return this;
        }
        
        /**
         * Builds the PatientProfile with validation.
         * @return a validated PatientProfile
         * @throws IllegalStateException if required fields are missing or invalid
         */
        public PatientProfile build() {
            // Validate required fields
            if (id == null || id.isBlank()) {
                throw new IllegalStateException("Patient ID is required");
            }
            if (doctorEmail == null || doctorEmail.isBlank()) {
                throw new IllegalStateException("Doctor email is required");
            }
            if (name == null || name.isBlank()) {
                throw new IllegalStateException("Patient name is required");
            }
            if (age == null) {
                throw new IllegalStateException("Patient age is required");
            }
            if (age < 0 || age > 150) {
                throw new IllegalStateException("Patient age must be between 0 and 150");
            }
            if (gender == null || gender.isBlank()) {
                throw new IllegalStateException("Patient gender is required");
            }
            if (!gender.equalsIgnoreCase("male") && 
                !gender.equalsIgnoreCase("female") && 
                !gender.equalsIgnoreCase("other")) {
                throw new IllegalStateException("Patient gender must be 'male', 'female', or 'other'");
            }
            if (createdAt == null) {
                throw new IllegalStateException("Created timestamp is required");
            }
            
            // Validate email format if provided
            if (email != null && !email.isBlank()) {
                if (!email.matches("^[A-Za-z0-9+_.-]+@(.+)$")) {
                    throw new IllegalStateException("Invalid email format: " + email);
                }
            }
            
            // Validate phone format if provided
            if (phone != null && !phone.isBlank()) {
                String digits = phone.replaceAll("\\D", "");
                if (digits.length() < 10) {
                    throw new IllegalStateException("Phone number must have at least 10 digits");
                }
            }
            
            // Validate emergency contact if provided
            if (emergencyContact != null) {
                if (!emergencyContact.isValidPhone()) {
                    throw new IllegalStateException("Emergency contact phone is invalid");
                }
            }
            
            // Validate chronic conditions
            for (ChronicCondition condition : chronicConditions) {
                if (!condition.isValidIcd10Code()) {
                    throw new IllegalStateException(
                        "Invalid ICD-10 code for condition: " + condition.getName());
                }
            }
            
            return new PatientProfile(this);
        }
    }
}
