package com.scribehealth.service;

import com.scribehealth.model.AuditLog;
import java.util.List;

public interface AuditService {
    void log(String actorId, String action, String entityType, String entityId);
    List<AuditLog> getRecentLogs(int limit);
}
