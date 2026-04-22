package com.scribehealth.model;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class PatientProfileBuilder {

    private static final Set<String> KNOWN_ICD_CODES = Set.of(
            "E11.9",  // Type 2 diabetes mellitus without complications
            "I10",    // Essential (primary) hypertension
            "J45.909",// Unspecified asthma, uncomplicated
            "E78.5",  // Hyperlipidemia, unspecified
            "M54.5"   // Low back pain
    );

    private String name;
    private Integer age;
    private String gender;
    private String email;
    private String phone;

    private String createdByDoctorEmail;

    private final List<PatientProfile.ChronicCondition> chronicConditions = new ArrayList<>();
    private final List<PatientProfile.AllergyEntry> allergies = new ArrayList<>();

    private String emergencyContactName;
    private String emergencyContactPhone;

    private String insuranceProvider;
    private String insurancePolicyNumber;
    private String insuranceExpiry;

    public PatientProfileBuilder setCore(String name, int age, String gender, String email, String phone) {
        this.name = normalize(name);
        this.age = age;
        this.gender = normalize(gender);
        this.email = normalize(email);
        this.phone = normalize(phone);
        return this;
    }

    public PatientProfileBuilder setCreatedByDoctorEmail(String doctorEmail) {
        this.createdByDoctorEmail = normalize(doctorEmail);
        return this;
    }

    public PatientProfileBuilder addChronicCondition(String icdCode, String description) {
        this.chronicConditions.add(
                new PatientProfile.ChronicCondition(normalize(icdCode), normalize(description))
        );
        return this;
    }

    public PatientProfileBuilder addAllergy(String substance, String severity) {
        String normalizedSubstance = normalize(substance);
        String normalizedSeverity = normalize(severity);
        PatientProfile.AllergySeverity parsedSeverity;
        try {
            parsedSeverity = PatientProfile.AllergySeverity.valueOf(normalizedSeverity.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Allergy severity must be one of: mild, moderate, severe");
        }

        this.allergies.add(new PatientProfile.AllergyEntry(normalizedSubstance, parsedSeverity));
        return this;
    }

    public PatientProfileBuilder setEmergencyContact(String name, String phone) {
        this.emergencyContactName = normalize(name);
        this.emergencyContactPhone = normalize(phone);
        return this;
    }

    public PatientProfileBuilder setInsurance(String provider, String policyNumber, String expiry) {
        this.insuranceProvider = normalize(provider);
        this.insurancePolicyNumber = normalize(policyNumber);
        this.insuranceExpiry = normalize(expiry);
        return this;
    }

    public PatientProfile build() {
        validateCore();
        validateDoctorScope();
        validateChronicConditions();
        validateEmergencyContact();
        validateInsurance();

        PatientProfile profile = new PatientProfile();
        profile.setName(name);
        profile.setAge(age);
        profile.setGender(gender);
        profile.setEmail(email);
        profile.setPhone(phone);
        profile.setCreatedByDoctorEmail(createdByDoctorEmail);
        profile.setCreatedAt(Instant.now());
        profile.setChronicConditions(new ArrayList<>(chronicConditions));
        profile.setAllergies(new ArrayList<>(allergies));

        if (hasText(emergencyContactName) && hasText(emergencyContactPhone)) {
            profile.setEmergencyContact(new PatientProfile.EmergencyContact(emergencyContactName, emergencyContactPhone));
        }

        if (hasText(insuranceProvider) && hasText(insurancePolicyNumber) && hasText(insuranceExpiry)) {
            profile.setInsuranceDetails(
                    new PatientProfile.InsuranceDetails(
                            insuranceProvider,
                            insurancePolicyNumber,
                            LocalDate.parse(insuranceExpiry)
                    )
            );
        }

        return profile;
    }

    private void validateCore() {
        if (!hasText(name)) {
            throw new IllegalArgumentException("Patient name is required");
        }
        if (age == null || age <= 0) {
            throw new IllegalArgumentException("Patient age must be a positive number");
        }
        if (!hasText(gender)) {
            throw new IllegalArgumentException("Patient gender is required");
        }
        if (!hasText(email) || !email.contains("@")) {
            throw new IllegalArgumentException("A valid patient email is required");
        }
        if (!hasText(phone)) {
            throw new IllegalArgumentException("Patient phone is required");
        }
    }

    private void validateDoctorScope() {
        if (!hasText(createdByDoctorEmail)) {
            throw new IllegalArgumentException("Creating doctor context is required");
        }
    }

    private void validateChronicConditions() {
        for (PatientProfile.ChronicCondition condition : chronicConditions) {
            if (!hasText(condition.getIcdCode()) || !KNOWN_ICD_CODES.contains(condition.getIcdCode())) {
                throw new IllegalArgumentException(
                        "Invalid ICD code for chronic condition: " + condition.getIcdCode()
                );
            }
            if (!hasText(condition.getDescription())) {
                throw new IllegalArgumentException("Chronic condition description is required");
            }
        }
    }

    private void validateEmergencyContact() {
        boolean hasName = hasText(emergencyContactName);
        boolean hasPhone = hasText(emergencyContactPhone);

        if (hasName ^ hasPhone) {
            throw new IllegalArgumentException(
                    "Emergency contact is partially filled: both name and phone are required"
            );
        }
    }

    private void validateInsurance() {
        boolean hasProvider = hasText(insuranceProvider);
        boolean hasPolicyNumber = hasText(insurancePolicyNumber);
        boolean hasExpiry = hasText(insuranceExpiry);

        if (hasProvider || hasPolicyNumber || hasExpiry) {
            if (!(hasProvider && hasPolicyNumber && hasExpiry)) {
                throw new IllegalArgumentException(
                        "Insurance details are partially filled: provider, policyNumber, and expiry are all required"
                );
            }

            try {
                LocalDate.parse(insuranceExpiry);
            } catch (DateTimeParseException ex) {
                throw new IllegalArgumentException("Insurance expiry must be in ISO date format: YYYY-MM-DD");
            }
        }
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}