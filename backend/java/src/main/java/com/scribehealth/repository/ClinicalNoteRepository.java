package com.scribehealth.repository;

import com.scribehealth.model.ClinicalNote;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ClinicalNoteRepository extends MongoRepository<ClinicalNote, String> {
    Optional<ClinicalNote> findBySessionId(String sessionId);
}
