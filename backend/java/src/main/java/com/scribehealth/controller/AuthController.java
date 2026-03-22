package com.scribehealth.controller;

import com.scribehealth.dto.AuthResponse;
import com.scribehealth.dto.LoginRequest;
import com.scribehealth.dto.RegisterRequest;
import com.scribehealth.model.User;
import com.scribehealth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(
            @AuthenticationPrincipal String email) {

        User user = authService.getCurrentUser(email);
        return ResponseEntity.ok(new UserProfileResponse(user));
    }

    public static class UserProfileResponse {
        private final String id;
        private final String name;
        private final String email;
        private final String role;
        private final boolean isActive;
        private final String createdAt;
        private final String lastLoginAt;

        public UserProfileResponse(User user) {
            this.id          = user.getId();
            this.name        = user.getName();
            this.email       = user.getEmail();
            this.role        = user.getRole().name();
            this.isActive    = user.isActive();
            this.createdAt   = user.getCreatedAt() != null ? user.getCreatedAt().toString() : null;
            this.lastLoginAt = user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null;
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
