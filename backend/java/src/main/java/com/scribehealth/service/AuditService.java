package com.scribehealth.service;

import com.scribehealth.model.AuditLog;

import java.util.List;

public interface AuditService {

    void log(String userEmail, String action, String entityType, String entityId);

    void log(String userEmail, String action, String entityType,
             String entityId, String metadataJson);

    List<AuditLog> getRecentLogs(int limit, int offset);
}
