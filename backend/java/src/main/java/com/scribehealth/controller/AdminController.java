package com.scribehealth.controller;

import com.scribehealth.model.Role;
import com.scribehealth.model.User;
import com.scribehealth.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // GET /api/admin/users — list all users
    @GetMapping("/users")
    public ResponseEntity<List<UserSummary>> getAllUsers() {
        List<UserSummary> users = userRepository.findAll()
                .stream()
                .map(UserSummary::new)
                .toList();
        return ResponseEntity.ok(users);
    }

    // GET /api/admin/users/{id} — get one user
    @GetMapping("/users/{id}")
    public ResponseEntity<UserSummary> getUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + id));
        return ResponseEntity.ok(new UserSummary(user));
    }

    // PATCH /api/admin/users/{id}/deactivate — disable a user account
    @PatchMapping("/users/{id}/deactivate")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + id));
        user.setActive(false);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User deactivated", "userId", id));
    }

    // PATCH /api/admin/users/{id}/activate — re-enable a user account
    @PatchMapping("/users/{id}/activate")
    public ResponseEntity<Map<String, String>> activateUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + id));
        user.setActive(true);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User activated", "userId", id));
    }

    // GET /api/admin/stats — summary counts
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        List<User> all = userRepository.findAll();
        long totalUsers   = all.size();
        long totalDoctors = all.stream().filter(u -> u.getRole() == Role.DOCTOR).count();
        long totalAdmins  = all.stream().filter(u -> u.getRole() == Role.ADMIN).count();
        long activeUsers  = all.stream().filter(User::isActive).count();
        return ResponseEntity.ok(Map.of(
                "totalUsers",   totalUsers,
                "totalDoctors", totalDoctors,
                "totalAdmins",  totalAdmins,
                "activeUsers",  activeUsers
        ));
    }

    // DTO — safe user summary (no password hash)
    public static class UserSummary {
        private final String id;
        private final String name;
        private final String email;
        private final String role;
        private final boolean isActive;
        private final String createdAt;
        private final String lastLoginAt;

        public UserSummary(User user) {
            this.id          = user.getId();
            this.name        = user.getName();
            this.email       = user.getEmail();
            this.role        = user.getRole().name();
            this.isActive    = user.isActive();
            this.createdAt   = user.getCreatedAt()    != null ? user.getCreatedAt().toString()    : null;
            this.lastLoginAt = user.getLastLoginAt()  != null ? user.getLastLoginAt().toString()  : null;
        }

        public String getId()          { return id; }
        public String getName()        { return name; }
        public String getEmail()       { return email; }
        public String getRole()        { return role; }
        public boolean isActive()      { return isActive; }
        public String getCreatedAt()   { return createdAt; }
        public String getLastLoginAt() { return lastLoginAt; }
    }
}
