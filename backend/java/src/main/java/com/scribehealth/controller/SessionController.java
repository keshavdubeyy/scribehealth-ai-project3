package com.scribehealth.controller;

import com.scribehealth.model.ClinicalSession;
import com.scribehealth.model.User;
import com.scribehealth.repository.SessionRepository;
import com.scribehealth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public SessionController(SessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @GetMapping("/patient/{patientId}")
    public List<ClinicalSession> getSessionsByPatientId(@PathVariable String patientId) {
        return sessionRepository.findByPatientIdAndDoctorId(patientId, currentUser().getId());
    }

    @PostMapping
    public ClinicalSession createSession(@RequestBody ClinicalSession session) {
        session.setDoctorId(currentUser().getId());
        return sessionRepository.save(session);
    }

    @PutMapping("/{id}")
    public ClinicalSession updateSession(@PathVariable String id, @RequestBody ClinicalSession session) {
        ClinicalSession existing = sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!existing.getDoctorId().equals(currentUser().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        session.setId(id);
        session.setDoctorId(existing.getDoctorId());
        return sessionRepository.save(session);
    }

    @DeleteMapping("/{id}")
    public void deleteSession(@PathVariable String id) {
        ClinicalSession existing = sessionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!existing.getDoctorId().equals(currentUser().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        sessionRepository.deleteById(id);
    }
}
