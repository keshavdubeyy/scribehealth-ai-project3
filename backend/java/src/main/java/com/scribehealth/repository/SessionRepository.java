package com.scribehealth.repository;

import com.scribehealth.model.ConsultationSession;
import com.scribehealth.model.SessionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SessionRepository extends MongoRepository<ConsultationSession, String> {
    List<ConsultationSession> findByPatientId(String patientId);
    List<ConsultationSession> findByStatus(SessionStatus status);
}
