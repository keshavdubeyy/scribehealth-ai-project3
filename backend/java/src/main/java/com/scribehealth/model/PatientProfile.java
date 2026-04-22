package com.scribehealth.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "patients")
public class PatientProfile {

    @Id
    private String id;

    private String name;
    private int age;
    private String gender;
    private String email;
    private String phone;

    private String createdByDoctorEmail;
    private Instant createdAt;

    private List<ChronicCondition> chronicConditions = new ArrayList<>();
    private List<AllergyEntry> allergies = new ArrayList<>();
    private EmergencyContact emergencyContact;
    private InsuranceDetails insuranceDetails;

    PatientProfile() {
    }

    public String getId() {
        return id;
    }

    void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    void setAge(int age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    void setGender(String gender) {
        this.gender = gender;
    }

    public String getEmail() {
        return email;
    }

    void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCreatedByDoctorEmail() {
        return createdByDoctorEmail;
    }

    void setCreatedByDoctorEmail(String createdByDoctorEmail) {
        this.createdByDoctorEmail = createdByDoctorEmail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<ChronicCondition> getChronicConditions() {
        return chronicConditions;
    }

    void setChronicConditions(List<ChronicCondition> chronicConditions) {
        this.chronicConditions = chronicConditions;
    }

    public List<AllergyEntry> getAllergies() {
        return allergies;
    }

    void setAllergies(List<AllergyEntry> allergies) {
        this.allergies = allergies;
    }

    public EmergencyContact getEmergencyContact() {
        return emergencyContact;
    }

    void setEmergencyContact(EmergencyContact emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public InsuranceDetails getInsuranceDetails() {
        return insuranceDetails;
    }

    void setInsuranceDetails(InsuranceDetails insuranceDetails) {
        this.insuranceDetails = insuranceDetails;
    }

    public static class ChronicCondition {
        private String icdCode;
        private String description;

        public ChronicCondition() {
        }

        public ChronicCondition(String icdCode, String description) {
            this.icdCode = icdCode;
            this.description = description;
        }

        public String getIcdCode() {
            return icdCode;
        }

        public void setIcdCode(String icdCode) {
            this.icdCode = icdCode;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }

    public static class AllergyEntry {
        private String substance;
        private AllergySeverity severity;

        public AllergyEntry() {
        }

        public AllergyEntry(String substance, AllergySeverity severity) {
            this.substance = substance;
            this.severity = severity;
        }

        public String getSubstance() {
            return substance;
        }

        public void setSubstance(String substance) {
            this.substance = substance;
        }

        public AllergySeverity getSeverity() {
            return severity;
        }

        public void setSeverity(AllergySeverity severity) {
            this.severity = severity;
        }
    }

    public enum AllergySeverity {
        MILD,
        MODERATE,
        SEVERE
    }

    public static class EmergencyContact {
        private String name;
        private String phone;

        public EmergencyContact() {
        }

        public EmergencyContact(String name, String phone) {
            this.name = name;
            this.phone = phone;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }

    public static class InsuranceDetails {
        private String provider;
        private String policyNumber;
        private LocalDate expiry;

        public InsuranceDetails() {
        }

        public InsuranceDetails(String provider, String policyNumber, LocalDate expiry) {
            this.provider = provider;
            this.policyNumber = policyNumber;
            this.expiry = expiry;
        }

        public String getProvider() {
            return provider;
        }

        public void setProvider(String provider) {
            this.provider = provider;
        }

        public String getPolicyNumber() {
            return policyNumber;
        }

        public void setPolicyNumber(String policyNumber) {
            this.policyNumber = policyNumber;
        }

        public LocalDate getExpiry() {
            return expiry;
        }

        public void setExpiry(LocalDate expiry) {
            this.expiry = expiry;
        }
    }
}