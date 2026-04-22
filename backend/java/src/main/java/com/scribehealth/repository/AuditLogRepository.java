package com.scribehealth.repository;

import com.scribehealth.model.AuditLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.PageRequest;
import java.util.List;

public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    List<AuditLog> findAllByOrderByCreatedAtDesc(PageRequest pageRequest);
    List<AuditLog> findByActorIdOrderByCreatedAtDesc(String actorId);
    List<AuditLog> findByActionOrderByCreatedAtDesc(String action);
}
