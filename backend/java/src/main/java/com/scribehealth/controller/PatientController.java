package com.scribehealth.controller;

import com.scribehealth.builder.PatientProfileBuilder;
import com.scribehealth.builder.PatientProfileValidationException;
import com.scribehealth.dto.CreatePatientRequest;
import com.scribehealth.dto.UpdatePatientRequest;
import com.scribehealth.model.Patient;
import com.scribehealth.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    private final PatientRepository patientRepository;

    public PatientController(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @GetMapping
    public List<Patient> getMyPatients(@AuthenticationPrincipal String email) {
        return patientRepository.findByDoctorEmail(email);
    }

    @PostMapping
    public ResponseEntity<?> createPatient(@AuthenticationPrincipal String email,
                                           @RequestBody CreatePatientRequest req) {
        try {
            PatientProfileBuilder builder = new PatientProfileBuilder(req.getName(), req.getAge(), req.getGender())
                .withDoctorEmail(email);

            if (req.getEmail()             != null) builder.withEmail(req.getEmail());
            if (req.getPhone()             != null) builder.withPhone(req.getPhone());
            if (req.getChronicConditions() != null) builder.withChronicConditions(req.getChronicConditions());
            if (req.getAllergies()          != null) builder.withAllergies(req.getAllergies());
            if (req.getEmergencyContact()  != null) builder.withEmergencyContact(req.getEmergencyContact());
            if (req.getInsuranceDetails()  != null) builder.withInsuranceDetails(req.getInsuranceDetails());

            Patient patient = builder.build();
            Patient saved   = patientRepository.save(patient);
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
        Optional<Patient> existing = patientRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Patient patient = existing.get();
        if (!patient.getDoctorEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (req.getEmail()             != null) patient.setEmail(req.getEmail());
        if (req.getPhone()             != null) patient.setPhone(req.getPhone());
        if (req.getChronicConditions() != null) patient.setChronicConditions(req.getChronicConditions());
        if (req.getAllergies()          != null) patient.setAllergies(req.getAllergies());
        if (req.getEmergencyContact()  != null) patient.setEmergencyContact(req.getEmergencyContact());
        if (req.getInsuranceDetails()  != null) patient.setInsuranceDetails(req.getInsuranceDetails());

        return ResponseEntity.ok(patientRepository.save(patient));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePatient(@AuthenticationPrincipal String email,
                                           @PathVariable String id) {
        Optional<Patient> existing = patientRepository.findById(id);
        if (existing.isEmpty()) return ResponseEntity.notFound().build();
        if (!existing.get().getDoctorEmail().equals(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        patientRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
