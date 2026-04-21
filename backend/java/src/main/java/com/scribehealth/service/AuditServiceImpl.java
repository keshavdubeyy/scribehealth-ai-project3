package com.scribehealth.service;

import com.scribehealth.model.AuditLog;
import com.scribehealth.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void log(String userEmail, String action, String entityType, String entityId) {
        log(userEmail, action, entityType, entityId, "{}");
    }

    @Override
    public void log(String userEmail, String action, String entityType,
                    String entityId, String metadataJson) {
        try {
            auditLogRepository.save(
                    new AuditLog(userEmail, action, entityType, entityId, metadataJson));
        } catch (Exception ignored) {
            // Audit failures must never propagate to the caller
        }
    }

    @Override
    public List<AuditLog> getRecentLogs(int limit, int offset) {
        return auditLogRepository.findRecentLogs(limit, offset);
    }
}
