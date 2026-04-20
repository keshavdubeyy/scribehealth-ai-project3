package com.scribehealth.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "profiles")
public class User {

    @Id
    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @Column(name = "organization_id")
    private String organizationId;

    @Column(name = "specialization")
    private String specialization;

    @Column(name = "license_number")
    private String licenseNumber;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }

    public User() {}

    // Convenience: expose email as id so existing controller code compiles unchanged
    public String getId()             { return email; }

    public String getEmail()          { return email; }
    public void   setEmail(String v)  { this.email = v; }

    public String getName()           { return name; }
    public void   setName(String v)   { this.name = v; }

    public Role   getRole()           { return role; }
    public void   setRole(Role v)     { this.role = v; }

    public String getOrganizationId()         { return organizationId; }
    public void   setOrganizationId(String v) { this.organizationId = v; }

    public String getSpecialization()          { return specialization; }
    public void   setSpecialization(String v)  { this.specialization = v; }

    public String getLicenseNumber()           { return licenseNumber; }
    public void   setLicenseNumber(String v)   { this.licenseNumber = v; }

    public boolean isActive()          { return isActive; }
    public void    setActive(boolean v){ this.isActive = v; }

    public Instant getCreatedAt()      { return createdAt; }
    public void    setCreatedAt(Instant v) { this.createdAt = v; }

    public String getPasswordHash()       { return passwordHash; }
    public void   setPasswordHash(String v){ this.passwordHash = v; }

    public Instant getLastLoginAt()        { return lastLoginAt; }
    public void    setLastLoginAt(Instant v){ this.lastLoginAt = v; }

    // Backward-compat: controllers still call getDoctorProfile() / setDoctorProfile()
    public DoctorProfile getDoctorProfile() {
        if (specialization == null && licenseNumber == null) return null;
        return new DoctorProfile(specialization, licenseNumber);
    }

    public void setDoctorProfile(DoctorProfile dp) {
        if (dp == null) return;
        this.specialization = dp.getSpecialization();
        this.licenseNumber  = dp.getLicenseNumber();
    }
}
