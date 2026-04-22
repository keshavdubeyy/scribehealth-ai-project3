package com.scribehealth.service;

import com.scribehealth.model.Patient;
import com.scribehealth.repository.PatientRepository;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;

@Service
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final AuditService auditService;

    public PatientServiceImpl(PatientRepository patientRepository, AuditService auditService) {
        this.patientRepository = patientRepository;
        this.auditService = auditService;
    }

    @Override
    public List<Patient> getPatientsByDoctor(String email) {
        return patientRepository.findByDoctorEmail(email);
    }

    @Override
    public Patient createPatient(String email, Patient patient) {
        patient.setDoctorEmail(email);
        patient.setCreatedAt(Instant.now());
        Patient saved = patientRepository.save(patient);
        auditService.log(email, "patient_created", "patient", saved.getId());
        return saved;
    }

    @Override
    public void deletePatient(String id) {
        patientRepository.deleteById(id);
    }
}
