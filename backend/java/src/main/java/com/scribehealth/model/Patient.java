package com.scribehealth.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "doctor_email", nullable = false)
    private String doctorEmail;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "age", nullable = false)
    private Integer age;

    @Column(name = "gender", nullable = false)
    private String gender;

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "organization_id")
    private String organizationId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "chronic_conditions", columnDefinition = "jsonb")
    private List<ChronicCondition> chronicConditions;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "allergies", columnDefinition = "jsonb")
    private List<PatientAllergy> allergies;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "emergency_contact", columnDefinition = "jsonb")
    private EmergencyContact emergencyContact;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "insurance_details", columnDefinition = "jsonb")
    private InsuranceDetails insuranceDetails;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 7);
        if (createdAt == null) createdAt = Instant.now();
    }

    public Patient() {}

    public String  getId()                              { return id; }
    public void    setId(String v)                      { this.id = v; }

    public String  getDoctorEmail()                     { return doctorEmail; }
    public void    setDoctorEmail(String v)             { this.doctorEmail = v; }

    public String  getName()                            { return name; }
    public void    setName(String v)                    { this.name = v; }

    public Integer getAge()                             { return age; }
    public void    setAge(Integer v)                    { this.age = v; }

    public String  getGender()                          { return gender; }
    public void    setGender(String v)                  { this.gender = v; }

    public String  getEmail()                           { return email; }
    public void    setEmail(String v)                   { this.email = v; }

    public String  getPhone()                           { return phone; }
    public void    setPhone(String v)                   { this.phone = v; }

    public String  getOrganizationId()                  { return organizationId; }
    public void    setOrganizationId(String v)          { this.organizationId = v; }

    public List<ChronicCondition> getChronicConditions()              { return chronicConditions; }
    public void                   setChronicConditions(List<ChronicCondition> v) { this.chronicConditions = v; }

    public List<PatientAllergy>   getAllergies()                       { return allergies; }
    public void                   setAllergies(List<PatientAllergy> v) { this.allergies = v; }

    public EmergencyContact       getEmergencyContact()                { return emergencyContact; }
    public void                   setEmergencyContact(EmergencyContact v) { this.emergencyContact = v; }

    public InsuranceDetails       getInsuranceDetails()                { return insuranceDetails; }
    public void                   setInsuranceDetails(InsuranceDetails v) { this.insuranceDetails = v; }

    public Instant getCreatedAt()                       { return createdAt; }
    public void    setCreatedAt(Instant v)              { this.createdAt = v; }
}
