package com.scribehealth.controller;

import com.scribehealth.model.User;
import com.scribehealth.service.DoctorProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/doctor")
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorController {

    private final DoctorProfileService doctorProfileService;

    public DoctorController(DoctorProfileService doctorProfileService) {
        this.doctorProfileService = doctorProfileService;
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(new ProfileResponse(doctorProfileService.getProfile(email)));
    }

    @PatchMapping("/profile")
    public ResponseEntity<Map<String, String>> updateProfile(
            @AuthenticationPrincipal String email,
            @RequestBody UpdateProfileRequest body) {
        doctorProfileService.updateProfile(email, body.getSpecialization(), body.getLicenseNumber());
        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

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

    public static class UpdateProfileRequest {
        private String specialization;
        private String licenseNumber;

        public String getSpecialization() { return specialization; }
        public void setSpecialization(String specialization) { this.specialization = specialization; }
        public String getLicenseNumber()  { return licenseNumber; }
        public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    }
}
