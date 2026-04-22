package com.scribehealth.service;

import com.scribehealth.model.AuditLog;
import com.scribehealth.repository.AuditLogRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void log(String actorId, String action, String entityType, String entityId) {
        auditLogRepository.save(new AuditLog(actorId, action, entityType, entityId));
    }

    @Override
    public List<AuditLog> getRecentLogs(int limit) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit));
    }
}
