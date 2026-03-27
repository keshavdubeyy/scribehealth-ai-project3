package com.scribehealth.repository;

import com.scribehealth.model.Transcription;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface TranscriptionRepository extends MongoRepository<Transcription, String> {
    Optional<Transcription> findBySessionId(String sessionId);
}
