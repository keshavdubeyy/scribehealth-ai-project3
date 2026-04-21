package com.scribehealth.controller;

import com.scribehealth.dto.RegisterRequest;
import com.scribehealth.facade.AdminFacade;
import com.scribehealth.model.AuditLog;
import com.scribehealth.model.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminFacade adminFacade;

    public AdminController(AdminFacade adminFacade) {
        this.adminFacade = adminFacade;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserSummary>> getAllUsers() {
        List<UserSummary> users = adminFacade.getAllUsers()
                .stream()
                .map(UserSummary::new)
                .toList();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserSummary> getUser(@PathVariable String id) {
        return ResponseEntity.ok(new UserSummary(adminFacade.getUser(id)));
    }

    @PostMapping("/users")
    public ResponseEntity<UserSummary> createUser(
            @Valid @RequestBody RegisterRequest request,
            @AuthenticationPrincipal String actorEmail) {
        User created = adminFacade.createUser(request, actorEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(new UserSummary(created));
    }

    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<Map<String, String>> deactivateUser(
            @PathVariable String id,
            @AuthenticationPrincipal String actorEmail) {
        adminFacade.deactivateUser(id, actorEmail);
        return ResponseEntity.ok(Map.of("message", "User deactivated", "userId", id));
    }

    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<Map<String, String>> activateUser(
            @PathVariable String id,
            @AuthenticationPrincipal String actorEmail) {
        adminFacade.activateUser(id, actorEmail);
        return ResponseEntity.ok(Map.of("message", "User activated", "userId", id));
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(adminFacade.getStats());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogSummary>> getAuditLogs(
            @RequestParam(defaultValue = "200") int limit,
            @RequestParam(defaultValue = "0")   int offset) {
        List<AuditLogSummary> logs = adminFacade.getAuditLogs(limit, offset)
                .stream()
                .map(AuditLogSummary::new)
                .toList();
        return ResponseEntity.ok(logs);
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public static class UserSummary {
        private final String  id;
        private final String  name;
        private final String  email;
        private final String  role;
        private final boolean isActive;
        private final String  createdAt;
        private final String  lastLoginAt;

        public UserSummary(User user) {
            this.id          = user.getId();
            this.name        = user.getName();
            this.email       = user.getEmail();
            this.role        = user.getRole().name();
            this.isActive    = user.isActive();
            this.createdAt   = user.getCreatedAt()   != null ? user.getCreatedAt().toString()   : null;
            this.lastLoginAt = user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null;
        }

        public String  getId()          { return id; }
        public String  getName()        { return name; }
        public String  getEmail()       { return email; }
        public String  getRole()        { return role; }
        public boolean isActive()       { return isActive; }
        public String  getCreatedAt()   { return createdAt; }
        public String  getLastLoginAt() { return lastLoginAt; }
    }

    public static class AuditLogSummary {
        private final String id;
        private final String userEmail;
        private final String action;
        private final String entityType;
        private final String entityId;
        private final String metadata;
        private final String createdAt;

        public AuditLogSummary(AuditLog log) {
            this.id         = log.getId()        != null ? log.getId().toString()        : null;
            this.userEmail  = log.getUserEmail();
            this.action     = log.getAction();
            this.entityType = log.getEntityType();
            this.entityId   = log.getEntityId();
            this.metadata   = log.getMetadata();
            this.createdAt  = log.getCreatedAt() != null ? log.getCreatedAt().toString() : null;
        }

        public String getId()         { return id; }
        public String getUserEmail()  { return userEmail; }
        public String getAction()     { return action; }
        public String getEntityType() { return entityType; }
        public String getEntityId()   { return entityId; }
        public String getMetadata()   { return metadata; }
        public String getCreatedAt()  { return createdAt; }
    }
}
