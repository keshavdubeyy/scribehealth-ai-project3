package com.scribehealth.service;

public interface AuditService {
    void log(String actorId, String action, String entityType, String entityId);
}
