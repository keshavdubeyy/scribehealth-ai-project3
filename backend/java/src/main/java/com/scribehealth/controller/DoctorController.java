package com.scribehealth.controller;

import com.scribehealth.model.User;
import com.scribehealth.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    private final UserRepository userRepository;

    public DoctorController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // GET /api/doctor/profile — get own profile
    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        return ResponseEntity.ok(new ProfileResponse(user));
    }

    // PATCH /api/doctor/profile — update specialization & license
    @PatchMapping("/profile")
    public ResponseEntity<Map<String, String>> updateProfile(
            @AuthenticationPrincipal String email,
            @RequestBody UpdateProfileRequest body) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (user.getDoctorProfile() == null) {
            user.setDoctorProfile(new com.scribehealth.model.DoctorProfile());
        }

        if (body.getSpecialization() != null) {
            user.getDoctorProfile().setSpecialization(body.getSpecialization());
        }
        if (body.getLicenseNumber() != null) {
            user.getDoctorProfile().setLicenseNumber(body.getLicenseNumber());
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    // DTO — full profile response
    public static class ProfileResponse {
        private final String id;
        private final String name;
        private final String email;
        private final String role;
        private final boolean isActive;
        private final String createdAt;
        private final String lastLoginAt;
        private final String specialization;
        private final String licenseNumber;

        public ProfileResponse(User user) {
            this.id             = user.getId();
            this.name           = user.getName();
            this.email          = user.getEmail();
            this.role           = user.getRole().name();
            this.isActive       = user.isActive();
            this.createdAt      = user.getCreatedAt()   != null ? user.getCreatedAt().toString()   : null;
            this.lastLoginAt    = user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null;
            this.specialization = user.getDoctorProfile() != null ? user.getDoctorProfile().getSpecialization() : null;
            this.licenseNumber  = user.getDoctorProfile() != null ? user.getDoctorProfile().getLicenseNumber()  : null;
        }

        public String getId()             { return id; }
        public String getName()           { return name; }
        public String getEmail()          { return email; }
        public String getRole()           { return role; }
        public boolean isActive()         { return isActive; }
        public String getCreatedAt()      { return createdAt; }
        public String getLastLoginAt()    { return lastLoginAt; }
        public String getSpecialization() { return specialization; }
        public String getLicenseNumber()  { return licenseNumber; }
    }

    // DTO — update request body
    public static class UpdateProfileRequest {
        private String specialization;
        private String licenseNumber;

        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getLicenseNumber()  { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    }
}
