package com.scribehealth.service;

import com.scribehealth.model.ClinicalSession;
import com.scribehealth.repository.SessionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final AuditService auditService;

    public SessionServiceImpl(SessionRepository sessionRepository, AuditService auditService) {
        this.sessionRepository = sessionRepository;
        this.auditService = auditService;
    }

    @Override
    public List<ClinicalSession> getSessionsByPatient(String patientId, String doctorId) {
        return sessionRepository.findByPatientIdAndDoctorId(patientId, doctorId);
    }

    @Override
    public ClinicalSession createSession(ClinicalSession session, String doctorId) {
        session.setDoctorId(doctorId);
        ClinicalSession saved = sessionRepository.save(session);
        auditService.log(doctorId, "session_created", "session", saved.getId());
        return saved;
    }

    @Override
    public ClinicalSession updateSession(String sessionId, ClinicalSession session, String doctorId) {
        ClinicalSession existing = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!existing.getDoctorId().equals(doctorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        session.setId(sessionId);
        session.setDoctorId(existing.getDoctorId());
        return sessionRepository.save(session);
    }

    @Override
    public void deleteSession(String sessionId, String doctorId) {
        ClinicalSession existing = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!existing.getDoctorId().equals(doctorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        sessionRepository.deleteById(sessionId);
        auditService.log(doctorId, "session_deleted", "session", sessionId);
    }
}
