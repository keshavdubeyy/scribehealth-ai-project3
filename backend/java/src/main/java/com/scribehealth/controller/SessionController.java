package com.scribehealth.controller;

import com.scribehealth.model.ClinicalSession;
import com.scribehealth.repository.SessionRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    private final SessionRepository sessionRepository;

    public SessionController(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    @GetMapping("/patient/{patientId}")
    public List<ClinicalSession> getSessionsByPatient(@PathVariable String patientId) {
        return sessionRepository.findByPatientId(patientId);
    }

    @GetMapping
    public List<ClinicalSession> getMySessions(@AuthenticationPrincipal String email) {
        return sessionRepository.findByDoctorEmail(email);
    }

    @PostMapping
    public ClinicalSession createSession(@AuthenticationPrincipal String email,
                                         @RequestBody ClinicalSession session) {
        session.setDoctorEmail(email);
        return sessionRepository.save(session);
    }

    @PutMapping("/{id}")
    public ClinicalSession updateSession(@AuthenticationPrincipal String email,
                                          @PathVariable String id,
                                          @RequestBody ClinicalSession session) {
        session.setId(id);
        session.setDoctorEmail(email);
        return sessionRepository.save(session);
    }

    @DeleteMapping("/{id}")
    public void deleteSession(@PathVariable String id) {
        sessionRepository.deleteById(id);
    }
}
