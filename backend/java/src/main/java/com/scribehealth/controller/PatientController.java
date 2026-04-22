package com.scribehealth.controller;

import com.scribehealth.model.Patient;
import com.scribehealth.service.PatientService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

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
        return patientService.getPatientsByDoctor(email);
    }

    @GetMapping("/{id}")
    public Patient getPatient(@AuthenticationPrincipal String email,
                              @PathVariable String id) {
        return patientService.getPatient(id, email);
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public Patient createPatient(@AuthenticationPrincipal String email,
                                 @RequestBody Patient patient) {
        return patientService.createPatient(email, patient);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deletePatient(@AuthenticationPrincipal String email,
                              @PathVariable String id) {
        patientService.deletePatient(id, email);
    }
}
