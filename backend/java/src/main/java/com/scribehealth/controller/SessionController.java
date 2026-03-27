package com.scribehealth.controller;

import com.scribehealth.model.ClinicalSession;
import com.scribehealth.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    @Autowired
    private SessionRepository sessionRepository;

    @GetMapping("/patient/{patientId}")
    public List<ClinicalSession> getSessionsByPatientId(@PathVariable String patientId) {
        return sessionRepository.findByPatientId(patientId);
    }

    @PostMapping
    public ClinicalSession createSession(@RequestBody ClinicalSession session) {
        return sessionRepository.save(session);
    }

    @PutMapping("/{id}")
    public ClinicalSession updateSession(@PathVariable String id, @RequestBody ClinicalSession session) {
        session.setId(id);
        return sessionRepository.save(session);
    }

    @DeleteMapping("/{id}")
    public void deleteSession(@PathVariable String id) {
        sessionRepository.deleteById(id);
    }
}
