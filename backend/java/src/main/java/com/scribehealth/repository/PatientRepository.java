package com.scribehealth.repository;

import com.scribehealth.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientRepository extends JpaRepository<Patient, String> {
    List<Patient> findByDoctorEmail(String doctorEmail);
    java.util.Optional<Patient> findByIdAndDoctorEmail(String id, String doctorEmail);
}
