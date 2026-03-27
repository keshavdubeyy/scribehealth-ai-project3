package com.scribehealth.repository;

import com.scribehealth.model.Prescription;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PrescriptionRepository extends MongoRepository<Prescription, String> {
    List<Prescription> findBySessionId(String sessionId);
}
