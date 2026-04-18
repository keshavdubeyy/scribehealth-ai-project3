package com.scribehealth.repository;

import com.scribehealth.model.ClinicalSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SessionRepository extends MongoRepository<ClinicalSession, String> {
    List<ClinicalSession> findByPatientId(String patientId);
    List<ClinicalSession> findByPatientIdAndDoctorId(String patientId, String doctorId);
}
