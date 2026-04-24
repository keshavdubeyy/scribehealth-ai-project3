package com.scribehealth.builder;

import com.scribehealth.model.ChronicCondition;
import com.scribehealth.model.EmergencyContact;
import com.scribehealth.model.InsuranceDetails;
import com.scribehealth.model.Patient;
import com.scribehealth.model.PatientAllergy;

import java.util.List;
import java.util.regex.Pattern;

public class PatientProfileBuilder {

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private static final Pattern ICD_PATTERN =
        Pattern.compile("^[A-Z][0-9]{2}(\\.[0-9]+)?$");

    private final String name;
    private final int    age;
    private final String gender;

    private String              doctorEmail;
    private String              organizationId;
    private String              email;
    private String              phone;
    private List<ChronicCondition> chronicConditions;
    private List<PatientAllergy>   allergies;
    private EmergencyContact       emergencyContact;
    private InsuranceDetails       insuranceDetails;

    public PatientProfileBuilder(String name, int age, String gender) {
        this.name   = name;
        this.age    = age;
        this.gender = gender;
    }

    public PatientProfileBuilder withDoctorEmail(String doctorEmail) {
        this.doctorEmail = doctorEmail;
        return this;
    }

    public PatientProfileBuilder withOrganizationId(String organizationId) {
        this.organizationId = organizationId;
        return this;
    }

    public PatientProfileBuilder withEmail(String email) {
        this.email = email;
        return this;
    }

    public PatientProfileBuilder withPhone(String phone) {
        this.phone = phone;
        return this;
    }

    public PatientProfileBuilder withChronicConditions(List<ChronicCondition> conditions) {
        this.chronicConditions = conditions;
        return this;
    }

    public PatientProfileBuilder withAllergies(List<PatientAllergy> allergies) {
        this.allergies = allergies;
        return this;
    }

    public PatientProfileBuilder withEmergencyContact(EmergencyContact contact) {
        this.emergencyContact = contact;
        return this;
    }

    public PatientProfileBuilder withInsuranceDetails(InsuranceDetails details) {
        this.insuranceDetails = details;
        return this;
    }

    public Patient build() {
        validate();

        Patient patient = new Patient();
        patient.setDoctorEmail(doctorEmail);
        patient.setOrganizationId(organizationId);
        patient.setName(name.trim());
        patient.setAge(age);
        patient.setGender(gender.trim());
        patient.setEmail(email);
        patient.setPhone(phone);
        patient.setChronicConditions(chronicConditions);
        patient.setAllergies(allergies);
        patient.setEmergencyContact(emergencyContact);
        patient.setInsuranceDetails(insuranceDetails);
        return patient;
    }

    private void validate() {
        if (name == null || name.trim().isEmpty()) {
            throw new PatientProfileValidationException("Patient name is required.");
        }
        if (name.trim().length() > 100) {
            throw new PatientProfileValidationException("Patient name must be 100 characters or fewer.");
        }
        if (age < 0 || age > 150) {
            throw new PatientProfileValidationException("Age must be between 0 and 150.");
        }
        if (gender == null || gender.trim().isEmpty()) {
            throw new PatientProfileValidationException("Gender is required.");
        }
        if (email != null && !email.isEmpty() && !EMAIL_PATTERN.matcher(email).matches()) {
            throw new PatientProfileValidationException("Email address is not valid.");
        }
        if (phone != null && !phone.isEmpty() && digitCount(phone) < 7) {
            throw new PatientProfileValidationException("Phone number must contain at least 7 digits.");
        }
        if (chronicConditions != null) {
            for (ChronicCondition c : chronicConditions) {
                if (c.getName() == null || c.getName().trim().isEmpty()) {
                    throw new PatientProfileValidationException("Chronic condition name cannot be empty.");
                }
                if (c.getIcdCode() != null && !c.getIcdCode().isEmpty()
                        && !ICD_PATTERN.matcher(c.getIcdCode()).matches()) {
                    throw new PatientProfileValidationException(
                        "ICD code \"" + c.getIcdCode() + "\" is not valid. Expected format: A00 or A00.0");
                }
            }
        }
        if (allergies != null) {
            for (PatientAllergy a : allergies) {
                if (a.getSubstance() == null || a.getSubstance().trim().isEmpty()) {
                    throw new PatientProfileValidationException("Allergy substance cannot be empty.");
                }
                if (a.getSeverity() == null) {
                    throw new PatientProfileValidationException("Allergy severity must be mild, moderate, or severe.");
                }
            }
        }
        if (emergencyContact != null) {
            if (emergencyContact.getName() == null || emergencyContact.getName().trim().isEmpty()) {
                throw new PatientProfileValidationException("Emergency contact name is required.");
            }
            if (emergencyContact.getPhone() == null || emergencyContact.getPhone().trim().isEmpty()) {
                throw new PatientProfileValidationException("Emergency contact phone is required.");
            }
            if (digitCount(emergencyContact.getPhone()) < 7) {
                throw new PatientProfileValidationException("Emergency contact phone must contain at least 7 digits.");
            }
        }
        if (insuranceDetails != null) {
            if (insuranceDetails.getProvider() == null || insuranceDetails.getProvider().trim().isEmpty()) {
                throw new PatientProfileValidationException("Insurance provider is required.");
            }
            if (insuranceDetails.getPolicyNumber() == null || insuranceDetails.getPolicyNumber().trim().isEmpty()) {
                throw new PatientProfileValidationException("Insurance policy number is required.");
            }
        }
    }

    private static int digitCount(String s) {
        int count = 0;
        for (char c : s.toCharArray()) {
            if (Character.isDigit(c)) count++;
        }
        return count;
    }
}
