package com.scribehealth.controller;

import com.scribehealth.model.*;
import com.scribehealth.service.ConsultationService;
import com.scribehealth.service.PatientService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ScribeController {
    private final PatientService patientService;
    private final ConsultationService consultationService;

    public ScribeController(PatientService patientService, ConsultationService consultationService) {
        this.patientService = patientService;
        this.consultationService = consultationService;
    }

    // Patient
    @GetMapping("/patients")
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }

    @PostMapping("/patients")
    public Patient createPatient(@RequestBody Patient patient) {
        return patientService.createPatient(patient);
    }

    @DeleteMapping("/patients/{id}")
    public ResponseEntity<Void> deletePatient(@PathVariable String id) {
        patientService.deletePatient(id);
        return ResponseEntity.noContent().build();
    }

    // Sessions
    @GetMapping("/sessions/{patientId}")
    public List<ConsultationSession> getSessions(@PathVariable String patientId) {
        return consultationService.getSessionsByPatient(patientId);
    }

    @PostMapping("/sessions")
    public ConsultationSession createSession(@RequestParam String patientId) {
        return consultationService.createSession(patientId);
    }

    @PatchMapping("/sessions/{id}/status")
    public ConsultationSession updateStatus(@PathVariable String id, @RequestParam SessionStatus status) {
        return consultationService.updateSessionStatus(id, status);
    }

    // Transcription (POST /transcribe)
    @PostMapping("/transcribe")
    public Transcription transcribe(@RequestBody Transcription transcription) {
        return consultationService.saveTranscription(transcription);
    }

    @GetMapping("/transcriptions/{sessionId}")
    public ResponseEntity<Transcription> getTranscription(@PathVariable String sessionId) {
        return consultationService.getTranscription(sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Generate Note (POST /generate-note)
    @PostMapping("/generate-note")
    public ClinicalNote generateNote(@RequestBody ClinicalNote note) {
        return consultationService.saveNote(note);
    }

    @GetMapping("/notes/{sessionId}")
    public ResponseEntity<ClinicalNote> getNote(@PathVariable String sessionId) {
        return consultationService.getNote(sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Prescriptions (POST /prescriptions)
    @GetMapping("/prescriptions/{sessionId}")
    public List<Prescription> getPrescriptions(@PathVariable String sessionId) {
        return consultationService.getPrescriptions(sessionId);
    }

    @PostMapping("/prescriptions")
    public Prescription addPrescription(@RequestBody Prescription prescription) {
        return consultationService.addPrescription(prescription);
    }

    @DeleteMapping("/prescriptions/{id}")
    public ResponseEntity<Void> removePrescription(@PathVariable String id) {
        consultationService.removePrescription(id);
        return ResponseEntity.noContent().build();
    }
}
