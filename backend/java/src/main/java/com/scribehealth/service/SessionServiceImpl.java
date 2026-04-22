package com.scribehealth.service;

import com.scribehealth.model.ClinicalSession;
import com.scribehealth.model.Patient;
import com.scribehealth.repository.PatientRepository;
import com.scribehealth.repository.SessionRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.List;

@Service
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final PatientRepository patientRepository;
    private final AuditService auditService;

    public SessionServiceImpl(SessionRepository sessionRepository, 
                              PatientRepository patientRepository,
                              AuditService auditService) {
        this.sessionRepository = sessionRepository;
        this.patientRepository = patientRepository;
        this.auditService = auditService;
    }

    @Override
    public List<ClinicalSession> getSessionsByDoctor(String email) {
        return sessionRepository.findByDoctorEmail(email);
    }

    @Override
    public List<ClinicalSession> getSessionsByPatient(String doctorEmail, String patientId) {
        // Security check: ensure the patient belongs to the requesting doctor
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        
        if (!patient.getDoctorEmail().equals(doctorEmail)) {
            throw new AccessDeniedException("You do not have access to this patient's sessions");
        }
        
        return sessionRepository.findByPatientId(patientId);
    }

    @Override
    public ClinicalSession createSession(String email, ClinicalSession session) {
        session.setDoctorEmail(email);
        session.setCreatedAt(Instant.now());
        ClinicalSession saved = sessionRepository.save(session);
        auditService.log(email, "session_created", "session", saved.getId());
        return saved;
    }

    @Override
    public ClinicalSession updateSession(String email, String id, ClinicalSession session) {
        session.setId(id);
        session.setDoctorEmail(email);
        ClinicalSession saved = sessionRepository.save(session);
        auditService.log(email, "session_updated", "session", saved.getId());
        return saved;
    }

    @Override
    public void deleteSession(String id) {
        sessionRepository.deleteById(id);
    }
}
