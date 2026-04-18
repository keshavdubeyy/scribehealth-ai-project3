package com.scribehealth.controller;

import com.scribehealth.model.Patient;
import com.scribehealth.model.User;
import com.scribehealth.repository.PatientRepository;
import com.scribehealth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    public PatientController(PatientRepository patientRepository, UserRepository userRepository) {
        this.patientRepository = patientRepository;
        this.userRepository = userRepository;
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @GetMapping
    public List<Patient> getAllPatients() {
        return patientRepository.findByDoctorId(currentUser().getId());
    }

    @PostMapping
    public Patient createPatient(@RequestBody Patient patient) {
        patient.setDoctorId(currentUser().getId());
        return patientRepository.save(patient);
    }

    @GetMapping("/{id}")
    public Patient getPatient(@PathVariable String id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!patient.getDoctorId().equals(currentUser().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return patient;
    }

    @DeleteMapping("/{id}")
    public void deletePatient(@PathVariable String id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!patient.getDoctorId().equals(currentUser().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        patientRepository.deleteById(id);
    }
}
