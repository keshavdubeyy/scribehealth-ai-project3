package com.scribehealth.controller;

import com.scribehealth.model.Role;
import com.scribehealth.model.User;
import com.scribehealth.model.DoctorProfile;
import com.scribehealth.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
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

    // POST /api/admin/users — admin creates a new user account (FR-02)
    @PostMapping("/users")
    public ResponseEntity<?> createUser(@Valid @RequestBody CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "An account with email " + request.getEmail() + " already exists"));
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);
        user.setCreatedAt(Instant.now());

        if (request.getSpecialization() != null || request.getLicenseNumber() != null) {
            user.setDoctorProfile(new DoctorProfile(
                    request.getSpecialization(),
                    request.getLicenseNumber()
            ));
        }

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(new UserSummary(saved));
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

    // ── Request DTO for POST /api/admin/users ───────────────────────────────
    public static class CreateUserRequest {

        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Must be a valid email address")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        @NotNull(message = "Role is required (DOCTOR or ADMIN)")
        private Role role;

        // Optional doctor profile fields
        private String specialization;
        private String licenseNumber;

        public String getName()            { return name; }
        public void   setName(String v)    { this.name = v; }
        public String getEmail()           { return email; }
        public void   setEmail(String v)   { this.email = v; }
        public String getPassword()        { return password; }
        public void   setPassword(String v){ this.password = v; }
        public Role   getRole()            { return role; }
        public void   setRole(Role v)      { this.role = v; }
        public String getSpecialization()       { return specialization; }
        public void   setSpecialization(String v){ this.specialization = v; }
        public String getLicenseNumber()        { return licenseNumber; }
        public void   setLicenseNumber(String v){ this.licenseNumber = v; }
    }

    // ── Response DTO — safe user summary (no password hash) ──────────────────
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
