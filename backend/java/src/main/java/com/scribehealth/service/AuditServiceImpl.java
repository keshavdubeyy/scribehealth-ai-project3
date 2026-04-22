package com.scribehealth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AuditServiceImpl implements AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditServiceImpl.class);

    @Override
    public void log(String actorId, String action, String entityType, String entityId) {
        log.info("AUDIT actor={} action={} entityType={} entityId={}", actorId, action, entityType, entityId);
    }
}
