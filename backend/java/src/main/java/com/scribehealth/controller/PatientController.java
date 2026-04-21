package com.scribehealth.controller;

import com.scribehealth.model.Patient;
import com.scribehealth.repository.PatientRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
    public Patient createPatient(@AuthenticationPrincipal String email,
                                 @RequestBody Patient patient) {
        patient.setDoctorEmail(email);
        return patientRepository.save(patient);
    }

    @DeleteMapping("/{id}")
    public void deletePatient(@PathVariable String id) {
        patientRepository.deleteById(id);
    }
}
