package com.scribehealth.controller;

import com.scribehealth.model.ClinicalSession;
import com.scribehealth.service.SessionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/patient/{patientId}")
    public List<ClinicalSession> getSessionsByPatient(
            @AuthenticationPrincipal String email,
            @PathVariable String patientId) {
        return sessionService.getSessionsByPatient(email, patientId);
    }

    @GetMapping
    public List<ClinicalSession> getMySessions(@AuthenticationPrincipal String email) {
        return sessionService.getSessionsByDoctor(email);
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ClinicalSession createSession(@AuthenticationPrincipal String email,
                                         @RequestBody ClinicalSession session) {
        return sessionService.createSession(email, session);
    }

    @PutMapping("/{id}")
    public ClinicalSession updateSession(@AuthenticationPrincipal String email,
                                          @PathVariable String id,
                                          @RequestBody ClinicalSession session) {
        return sessionService.updateSession(email, id, session);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteSession(@AuthenticationPrincipal String email,
                              @PathVariable String id) {
        sessionService.deleteSession(id, email);
    }
}
