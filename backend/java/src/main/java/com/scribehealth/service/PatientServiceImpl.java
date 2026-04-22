package com.scribehealth.service;

import com.scribehealth.model.Patient;
import com.scribehealth.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
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
    public List<Patient> getPatientsByDoctor(String doctorId) {
        return patientRepository.findByDoctorId(doctorId);
    }

    @Override
    public Patient getPatient(String patientId, String doctorId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!patient.getDoctorId().equals(doctorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return patient;
    }

    @Override
    public Patient createPatient(Patient patient, String doctorId) {
        patient.setDoctorId(doctorId);
        Patient saved = patientRepository.save(patient);
        auditService.log(doctorId, "patient_created", "patient", saved.getId());
        return saved;
    }

    @Override
    public void deletePatient(String patientId, String doctorId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!patient.getDoctorId().equals(doctorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        patientRepository.deleteById(patientId);
        auditService.log(doctorId, "patient_deleted", "patient", patientId);
    }
}
