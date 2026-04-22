package com.scribehealth.controller;

import com.scribehealth.model.ClinicalSession;
import com.scribehealth.model.User;
import com.scribehealth.repository.UserRepository;
import com.scribehealth.service.SessionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final UserRepository userRepository;

    public SessionController(SessionService sessionService, UserRepository userRepository) {
        this.sessionService = sessionService;
        this.userRepository = userRepository;
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @GetMapping("/patient/{patientId}")
    public List<ClinicalSession> getSessionsByPatientId(@PathVariable String patientId) {
        return sessionService.getSessionsByPatient(patientId, currentUser().getId());
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ClinicalSession createSession(@RequestBody ClinicalSession session) {
        return sessionService.createSession(session, currentUser().getId());
    }

    @PutMapping("/{id}")
    public ClinicalSession updateSession(@PathVariable String id, @RequestBody ClinicalSession session) {
        return sessionService.updateSession(id, session, currentUser().getId());
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteSession(@PathVariable String id) {
        sessionService.deleteSession(id, currentUser().getId());
    }
}
