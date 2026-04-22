package com.scribehealth.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

public class CreatePatientRequest {

    @NotBlank
    private String name;

    @NotNull
    @Min(1)
    private Integer age;

    @NotBlank
    private String gender;

    @NotBlank
    private String email;

    @NotBlank
    private String phone;

    private List<ChronicConditionInput> chronicConditions = new ArrayList<>();
    private List<AllergyInput> allergies = new ArrayList<>();
    private EmergencyContactInput emergencyContact;
    private InsuranceDetailsInput insuranceDetails;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public List<ChronicConditionInput> getChronicConditions() {
        return chronicConditions;
    }

    public void setChronicConditions(List<ChronicConditionInput> chronicConditions) {
        this.chronicConditions = chronicConditions;
    }

    public List<AllergyInput> getAllergies() {
        return allergies;
    }

    public void setAllergies(List<AllergyInput> allergies) {
        this.allergies = allergies;
    }

    public EmergencyContactInput getEmergencyContact() {
        return emergencyContact;
    }

    public void setEmergencyContact(EmergencyContactInput emergencyContact) {
        this.emergencyContact = emergencyContact;
    }

    public InsuranceDetailsInput getInsuranceDetails() {
        return insuranceDetails;
    }

    public void setInsuranceDetails(InsuranceDetailsInput insuranceDetails) {
        this.insuranceDetails = insuranceDetails;
    }

    public static class ChronicConditionInput {
        private String icdCode;
        private String description;

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

    public static class AllergyInput {
        private String substance;
        private String severity;

        public String getSubstance() {
            return substance;
        }

        public void setSubstance(String substance) {
            this.substance = substance;
        }

        public String getSeverity() {
            return severity;
        }

        public void setSeverity(String severity) {
            this.severity = severity;
        }
    }

    public static class EmergencyContactInput {
        private String name;
        private String phone;

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

    public static class InsuranceDetailsInput {
        private String provider;
        private String policyNumber;
        private String expiry;

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

        public String getExpiry() {
            return expiry;
        }

        public void setExpiry(String expiry) {
            this.expiry = expiry;
        }
    }
}