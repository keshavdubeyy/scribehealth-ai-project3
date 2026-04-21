package com.scribehealth.service;

import com.scribehealth.builder.PatientProfileBuilder;
import com.scribehealth.dto.CreatePatientRequest;
import com.scribehealth.dto.UpdatePatientRequest;
import com.scribehealth.model.Patient;
import com.scribehealth.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    public PatientServiceImpl(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public List<Patient> getPatientsForDoctor(String doctorEmail) {
        return patientRepository.findByDoctorEmail(doctorEmail);
    }

    @Override
    public Patient getPatientForDoctor(String doctorEmail, String patientId) {
        return patientRepository.findByIdAndDoctorEmail(patientId, doctorEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @Override
    public Patient createPatient(String doctorEmail, CreatePatientRequest req) {
        PatientProfileBuilder builder = new PatientProfileBuilder(req.getName(), req.getAge(), req.getGender())
            .withDoctorEmail(doctorEmail);

        if (req.getEmail()             != null) builder.withEmail(req.getEmail());
        if (req.getPhone()             != null) builder.withPhone(req.getPhone());
        if (req.getChronicConditions() != null) builder.withChronicConditions(req.getChronicConditions());
        if (req.getAllergies()          != null) builder.withAllergies(req.getAllergies());
        if (req.getEmergencyContact()  != null) builder.withEmergencyContact(req.getEmergencyContact());
        if (req.getInsuranceDetails()  != null) builder.withInsuranceDetails(req.getInsuranceDetails());

        Patient patient = builder.build();
        return patientRepository.save(patient);
    }

    @Override
    public Patient updatePatient(String doctorEmail, String patientId, UpdatePatientRequest req) {
        Patient patient = patientRepository.findByIdAndDoctorEmail(patientId, doctorEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        if (req.getEmail()             != null) patient.setEmail(req.getEmail());
        if (req.getPhone()             != null) patient.setPhone(req.getPhone());
        if (req.getChronicConditions() != null) patient.setChronicConditions(req.getChronicConditions());
        if (req.getAllergies()          != null) patient.setAllergies(req.getAllergies());
        if (req.getEmergencyContact()  != null) patient.setEmergencyContact(req.getEmergencyContact());
        if (req.getInsuranceDetails()  != null) patient.setInsuranceDetails(req.getInsuranceDetails());

        return patientRepository.save(patient);
    }

    @Override
    public void deletePatient(String doctorEmail, String patientId) {
        patientRepository.findByIdAndDoctorEmail(patientId, doctorEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        patientRepository.deleteById(patientId);
    }
}
