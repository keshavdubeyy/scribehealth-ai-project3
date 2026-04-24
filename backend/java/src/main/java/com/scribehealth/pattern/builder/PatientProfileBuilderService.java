package com.scribehealth.pattern.builder;

import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Service for building and validating PatientProfile objects.
 * 
 * This service provides convenience methods for creating PatientProfile instances
 * using the Builder pattern. It ensures all domain validations are applied before
 * the patient record is persisted.
 * 
 * Usage:
 * <pre>
 * PatientProfile profile = patientProfileBuilderService
 *     .newProfile("doctor@example.com")
 *     .basicInfo("John Doe", 45, "male")
 *     .contactInfo("john@example.com", "+1234567890")
 *     .addAllergy(Allergy.builder()
 *         .allergen("Penicillin")
 *         .severity(Allergy.Severity.SEVERE)
 *         .build())
 *     .build();
 * </pre>
 */
@Service
public class PatientProfileBuilderService {
    
    private final String doctorEmail;
    
    public PatientProfileBuilderService() {
        this.doctorEmail = null;
    }
    
    private PatientProfileBuilderService(String doctorEmail) {
        this.doctorEmail = doctorEmail;
    }
    
    /**
     * Starts building a new patient profile for the specified doctor.
     * 
     * @param doctorEmail the doctor's email address
     * @return a new PatientProfileBuilder for method chaining
     */
    public PatientProfileBuilderService newProfile(String doctorEmail) {
        return new PatientProfileBuilderService(doctorEmail);
    }
    
    /**
     * Sets the basic patient information.
     * 
     * @param name patient name
     * @param age patient age
     * @param gender patient gender (male, female, other)
     * @return a configured PatientProfileBuilder
     */
    public PatientProfileBuilder basicInfo(String name, int age, String gender) {
        return new PatientProfileBuilder(doctorEmail, name, age, gender);
    }
    
    /**
     * Fluent builder class for completing the PatientProfile construction.
     */
    public static class PatientProfileBuilder {
        private final PatientProfile.Builder internalBuilder;
        
        private PatientProfileBuilder(String doctorEmail, String name, int age, String gender) {
            this.internalBuilder = PatientProfile.builder()
                .doctorEmail(doctorEmail)
                .name(name)
                .age(age)
                .gender(gender)
                .id(generateId())
                .createdAt(Instant.now());
        }
        
        private static String generateId() {
            return java.util.UUID.randomUUID().toString()
                .replace("-", "")
                .substring(0, 7);
        }
        
        public PatientProfileBuilder contactInfo(String email, String phone) {
            internalBuilder.email(email).phone(phone);
            return this;
        }
        
        public PatientProfileBuilder organizationId(String organizationId) {
            internalBuilder.organizationId(organizationId);
            return this;
        }
        
        public PatientProfileBuilder addChronicCondition(ChronicCondition condition) {
            internalBuilder.addChronicCondition(condition);
            return this;
        }
        
        public PatientProfileBuilder chronicConditions(java.util.List<ChronicCondition> conditions) {
            internalBuilder.chronicConditions(conditions);
            return this;
        }
        
        public PatientProfileBuilder addAllergy(Allergy allergy) {
            internalBuilder.addAllergy(allergy);
            return this;
        }
        
        public PatientProfileBuilder allergies(java.util.List<Allergy> allergies) {
            internalBuilder.allergies(allergies);
            return this;
        }
        
        public PatientProfileBuilder emergencyContact(EmergencyContact emergencyContact) {
            internalBuilder.emergencyContact(emergencyContact);
            return this;
        }
        
        public PatientProfileBuilder insuranceDetails(InsuranceDetails insuranceDetails) {
            internalBuilder.insuranceDetails(insuranceDetails);
            return this;
        }
        
        /**
         * Builds the PatientProfile with all validations.
         * @return a validated PatientProfile
         * @throws IllegalStateException if required fields are missing or invalid
         */
        public PatientProfile build() {
            return internalBuilder.build();
        }
    }
    
    // Convenience static factory methods
    
    /**
     * Creates a minimal patient profile with just required fields.
     * 
     * @param doctorEmail the doctor's email
     * @param name patient name
     * @param age patient age
     * @param gender patient gender
     * @return a minimal PatientProfile
     */
    public static PatientProfile createMinimal(String doctorEmail, String name, int age, String gender) {
        return PatientProfile.builder()
            .doctorEmail(doctorEmail)
            .name(name)
            .age(age)
            .gender(gender)
            .id(generateId())
            .createdAt(Instant.now())
            .build();
    }
    
    private static String generateId() {
        return java.util.UUID.randomUUID().toString()
            .replace("-", "")
            .substring(0, 7);
    }
}
