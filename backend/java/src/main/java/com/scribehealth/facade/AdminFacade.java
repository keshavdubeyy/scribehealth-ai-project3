package com.scribehealth.facade;

import com.scribehealth.model.AuditLog;
import com.scribehealth.model.User;
import com.scribehealth.service.AuditService;
import com.scribehealth.service.UserService;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Facade pattern: single entry-point for all admin operations.
 * AdminController communicates exclusively through this class, hiding
 * the coordination between UserService and AuditService.
 */
@Component
public class AdminFacade {

    private final UserService userService;
    private final AuditService auditService;

    public AdminFacade(UserService userService, AuditService auditService) {
        this.userService  = userService;
        this.auditService = auditService;
    }

    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    public User getUser(String id) {
        return userService.getUser(id);
    }

    public void activateUser(String targetId, String actorEmail) {
        userService.activateUser(targetId);
        auditService.log(actorEmail, "user_activated", "user", targetId,
                "{\"targetUserId\":\"" + targetId + "\"}");
    }

    public void deactivateUser(String targetId, String actorEmail) {
        userService.deactivateUser(targetId);
        auditService.log(actorEmail, "user_deactivated", "user", targetId,
                "{\"targetUserId\":\"" + targetId + "\"}");
    }

    public Map<String, Long> getStats() {
        return userService.getStats();
    }

    public List<AuditLog> getAuditLogs(int limit, int offset) {
        return auditService.getRecentLogs(limit, offset);
    }
}
