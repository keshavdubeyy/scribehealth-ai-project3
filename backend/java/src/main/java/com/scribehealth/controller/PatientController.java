package com.scribehealth.controller;

import com.scribehealth.builder.PatientProfileValidationException;
import com.scribehealth.dto.CreatePatientRequest;
import com.scribehealth.dto.UpdatePatientRequest;
import com.scribehealth.model.Patient;
import com.scribehealth.service.PatientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public List<Patient> getMyPatients(@AuthenticationPrincipal String email) {
        return patientService.getPatientsForDoctor(email);
    }

    @GetMapping("/{id}")
    public Patient getPatient(@AuthenticationPrincipal String email,
                              @PathVariable String id) {
        return patientService.getPatient(id, email);
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ResponseEntity<?> createPatient(@AuthenticationPrincipal String email,
                                           @RequestBody CreatePatientRequest req) {
        try {
            Patient saved = patientService.createPatient(email, req);
            return ResponseEntity.ok(Map.of("id", saved.getId()));
        } catch (PatientProfileValidationException ex) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(Map.of("error", ex.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updatePatient(@AuthenticationPrincipal String email,
                                           @PathVariable String id,
                                           @RequestBody UpdatePatientRequest req) {
        Patient updated = patientService.updatePatient(email, id, req);
        return ResponseEntity.ok(updated);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePatient(@AuthenticationPrincipal String email,
                                           @PathVariable String id) {
        patientService.deletePatient(email, id);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
