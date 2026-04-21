package com.scribehealth.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;

@Entity
@Table(name = "sessions")
public class ClinicalSession {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "patient_id")
    private String patientId;

    @Column(name = "doctor_email", nullable = false)
    private String doctorEmail;

    @Column(name = "organization_id")
    private String organizationId;

    @Column(name = "status", nullable = false)
    private String status = "SCHEDULED";

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    // Stored as JSONB — serialized via Jackson automatically by Hibernate 6
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "soap", columnDefinition = "jsonb")
    private SoapNote soap;

    @Column(name = "transcription", columnDefinition = "text")
    private String transcription;

    @Column(name = "audio_url")
    private String audioUrl;

    // Default to empty JSON array; never null per schema constraint
    @Column(name = "edits", columnDefinition = "jsonb", nullable = false)
    private String edits = "[]";

    @PrePersist
    void prePersist() {
        if (id == null) id = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 7);
        if (createdAt == null) createdAt = Instant.now();
        if (edits == null) edits = "[]";
    }

    public ClinicalSession() {}

    public String    getId()                    { return id; }
    public void      setId(String v)            { this.id = v; }

    public String    getPatientId()             { return patientId; }
    public void      setPatientId(String v)     { this.patientId = v; }

    public String    getDoctorEmail()           { return doctorEmail; }
    public void      setDoctorEmail(String v)   { this.doctorEmail = v; }

    public String    getOrganizationId()        { return organizationId; }
    public void      setOrganizationId(String v){ this.organizationId = v; }

    public String    getStatus()                { return status; }
    public void      setStatus(String v)        { this.status = v; }

    public Instant   getCreatedAt()             { return createdAt; }
    public void      setCreatedAt(Instant v)    { this.createdAt = v; }

    public SoapNote  getSoap()                  { return soap; }
    public void      setSoap(SoapNote v)        { this.soap = v; }

    public String    getTranscription()         { return transcription; }
    public void      setTranscription(String v) { this.transcription = v; }

    public String    getAudioUrl()              { return audioUrl; }
    public void      setAudioUrl(String v)      { this.audioUrl = v; }

    public String    getEdits()                 { return edits; }
    public void      setEdits(String v)         { this.edits = v; }

    public static class SoapNote {
        private String s, o, a, p;

        public SoapNote() {}
        public SoapNote(String s, String o, String a, String p) {
            this.s = s; this.o = o; this.a = a; this.p = p;
        }

        public String getS() { return s; } public void setS(String v) { this.s = v; }
        public String getO() { return o; } public void setO(String v) { this.o = v; }
        public String getA() { return a; } public void setA(String v) { this.a = v; }
        public String getP() { return p; } public void setP(String v) { this.p = v; }
    }
}
