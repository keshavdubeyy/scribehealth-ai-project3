package com.scribehealth.service;

import com.scribehealth.dto.CreatePatientRequest;
import com.scribehealth.model.PatientProfile;
import com.scribehealth.model.PatientProfileBuilder;
import com.scribehealth.repository.PatientProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PatientProfileService {

    private final PatientProfileRepository patientProfileRepository;

    public PatientProfileService(PatientProfileRepository patientProfileRepository) {
        this.patientProfileRepository = patientProfileRepository;
    }

    public PatientProfile createPatientProfile(String doctorEmail, CreatePatientRequest request) {
        PatientProfileBuilder builder = new PatientProfileBuilder()
                .setCore(
                        request.getName(),
                        request.getAge(),
                        request.getGender(),
                        request.getEmail(),
                        request.getPhone()
                )
                .setCreatedByDoctorEmail(doctorEmail);

        for (CreatePatientRequest.ChronicConditionInput condition : request.getChronicConditions()) {
            builder.addChronicCondition(condition.getIcdCode(), condition.getDescription());
        }

        for (CreatePatientRequest.AllergyInput allergy : request.getAllergies()) {
            builder.addAllergy(allergy.getSubstance(), allergy.getSeverity());
        }

        if (request.getEmergencyContact() != null) {
            builder.setEmergencyContact(
                    request.getEmergencyContact().getName(),
                    request.getEmergencyContact().getPhone()
            );
        }

        if (request.getInsuranceDetails() != null) {
            builder.setInsurance(
                    request.getInsuranceDetails().getProvider(),
                    request.getInsuranceDetails().getPolicyNumber(),
                    request.getInsuranceDetails().getExpiry()
            );
        }

        PatientProfile patientProfile = builder.build();
        return patientProfileRepository.save(patientProfile);
    }

    public List<PatientProfile> getPatientsForDoctor(String doctorEmail) {
        return patientProfileRepository.findByCreatedByDoctorEmailOrderByCreatedAtDesc(doctorEmail);
    }
}