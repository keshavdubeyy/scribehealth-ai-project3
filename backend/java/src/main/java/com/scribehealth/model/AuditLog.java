package com.scribehealth.model;

import com.scribehealth.config.JsonbConverter;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid", updatable = false)
    private UUID id;

    @Column(name = "user_email", nullable = false)
    private String userEmail;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private String entityId;

    @Convert(converter = JsonbConverter.class)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata = "{}";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public AuditLog() {}

    public AuditLog(String userEmail, String action, String entityType,
                    String entityId, String metadata) {
        this.userEmail  = userEmail;
        this.action     = action;
        this.entityType = entityType;
        this.entityId   = entityId;
        this.metadata   = metadata != null ? metadata : "{}";
    }

    public UUID    getId()          { return id; }
    public String  getUserEmail()   { return userEmail; }
    public String  getAction()      { return action; }
    public String  getEntityType()  { return entityType; }
    public String  getEntityId()    { return entityId; }
    public String  getMetadata()    { return metadata; }
    public Instant getCreatedAt()   { return createdAt; }
}
