package com.scribehealth.repository;

import com.scribehealth.model.ClinicalSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SessionRepository extends JpaRepository<ClinicalSession, String> {
    List<ClinicalSession> findByPatientId(String patientId);
    List<ClinicalSession> findByDoctorEmail(String doctorEmail);
}
