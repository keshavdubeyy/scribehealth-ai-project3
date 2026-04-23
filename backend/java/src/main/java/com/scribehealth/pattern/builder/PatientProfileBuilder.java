package com.scribehealth.pattern.builder;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * PatientProfileBuilder - Builder Pattern for constructing PatientProfile objects
 * 
 * This builder provides a fluent API for constructing PatientProfile instances
 * with validated, step-by-step construction. It ensures no partially-initialized
 * records reach the database.
 * 
 * Usage:
 * <pre>
 * PatientProfile profile = PatientProfileBuilder.builder()
 *     .basicInfo("John Doe", 45, "male")
 *     .doctorEmail("doctor@example.com")
 *     .contactInfo("john@example.com", "+1234567890")
 *     .addChronicCondition(ChronicCondition.builder()
 *         .name("Hypertension")
 *         .icd10Code("I10")
 *         .build())
 *     .emergencyContact(EmergencyContact.builder()
 *         .name("Jane Doe")
 *         .phone("+0987654321")
 *         .relationship("spouse")
 *         .build())
 *     .build();
 * </pre>
 */
@Component
public class PatientProfileBuilder {
    
    private final PatientProfile.Builder internalBuilder;
    
    private PatientProfileBuilder() {
        this.internalBuilder = PatientProfile.builder()
            .id(generateId())
            .createdAt(Instant.now());
    }
    
    /**
     * Creates a new builder instance.
     * @return a new PatientProfileBuilder
     */
    public static PatientProfileBuilder builder() {
        return new PatientProfileBuilder();
    }
    
    /**
     * Sets the basic patient information.
     * 
     * @param name patient name
     * @param age patient age
     * @param gender patient gender (male, female, other)
     * @return this builder for chaining
     */
    public PatientProfileBuilder basicInfo(String name, int age, String gender) {
        internalBuilder.name(name).age(age).gender(gender);
        return this;
    }
    
    /**
     * Sets the doctor email.
     * 
     * @param doctorEmail the doctor's email address
     * @return this builder for chaining
     */
    public PatientProfileBuilder doctorEmail(String doctorEmail) {
        internalBuilder.doctorEmail(doctorEmail);
        return this;
    }
    
    /**
     * Sets the contact information.
     * 
     * @param email patient's email (optional, can be null)
     * @param phone patient's phone number (optional, can be null)
     * @return this builder for chaining
     */
    public PatientProfileBuilder contactInfo(String email, String phone) {
        internalBuilder.email(email).phone(phone);
        return this;
    }
    
    /**
     * Sets the organization ID.
     * 
     * @param organizationId the organization identifier
     * @return this builder for chaining
     */
    public PatientProfileBuilder organizationId(String organizationId) {
        internalBuilder.organizationId(organizationId);
        return this;
    }
    
    /**
     * Adds a chronic condition.
     * 
     * @param condition the chronic condition to add
     * @return this builder for chaining
     */
    public PatientProfileBuilder addChronicCondition(ChronicCondition condition) {
        internalBuilder.addChronicCondition(condition);
        return this;
    }
    
    /**
     * Sets the list of chronic conditions.
     * 
     * @param conditions list of chronic conditions
     * @return this builder for chaining
     */
    public PatientProfileBuilder chronicConditions(List<ChronicCondition> conditions) {
        internalBuilder.chronicConditions(conditions);
        return this;
    }
    
    /**
     * Adds an allergy.
     * 
     * @param allergy the allergy to add
     * @return this builder for chaining
     */
    public PatientProfileBuilder addAllergy(Allergy allergy) {
        internalBuilder.addAllergy(allergy);
        return this;
    }
    
    /**
     * Sets the list of allergies.
     * 
     * @param allergies list of allergies
     * @return this builder for chaining
     */
    public PatientProfileBuilder allergies(List<Allergy> allergies) {
        internalBuilder.allergies(allergies);
        return this;
    }
    
    /**
     * Sets the emergency contact.
     * 
     * @param emergencyContact the emergency contact
     * @return this builder for chaining
     */
    public PatientProfileBuilder emergencyContact(EmergencyContact emergencyContact) {
        internalBuilder.emergencyContact(emergencyContact);
        return this;
    }
    
    /**
     * Sets the insurance details.
     * 
     * @param insuranceDetails the insurance details
     * @return this builder for chaining
     */
    public PatientProfileBuilder insuranceDetails(InsuranceDetails insuranceDetails) {
        internalBuilder.insuranceDetails(insuranceDetails);
        return this;
    }
    
    /**
     * Builds the PatientProfile with all validations.
     * 
     * @return a validated, immutable PatientProfile
     * @throws IllegalStateException if required fields are missing or invalid
     */
    public PatientProfile build() {
        return internalBuilder.build();
    }
    
    /**
     * Generates a unique patient ID.
     * @return a 7-character alphanumeric ID
     */
    private static String generateId() {
        return java.util.UUID.randomUUID().toString()
            .replace("-", "")
            .substring(0, 7);
    }
}
