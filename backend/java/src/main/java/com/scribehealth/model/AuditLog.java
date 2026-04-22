package com.scribehealth.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;
    private String actorId;
    private String action;
    private String entityType;
    private String entityId;
    private Instant createdAt = Instant.now();

    public AuditLog() {}

    public AuditLog(String actorId, String action, String entityType, String entityId) {
        this.actorId    = actorId;
        this.action     = action;
        this.entityType = entityType;
        this.entityId   = entityId;
        this.createdAt  = Instant.now();
    }

    public String getId()          { return id; }
    public String getActorId()     { return actorId; }
    public String getAction()      { return action; }
    public String getEntityType()  { return entityType; }
    public String getEntityId()    { return entityId; }
    public Instant getCreatedAt()  { return createdAt; }
}
