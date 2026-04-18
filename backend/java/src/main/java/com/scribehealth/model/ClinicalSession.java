package com.scribehealth.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "sessions")
public class ClinicalSession {
    @Id
    private String id;
    private String patientId;
    private String doctorId;
    private String status;
    private LocalDateTime createdAt = LocalDateTime.now();

    private SoapNote soap;
    private String transcription;

    public ClinicalSession() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public SoapNote getSoap() { return soap; }
    public void setSoap(SoapNote soap) { this.soap = soap; }

    public String getTranscription() { return transcription; }
    public void setTranscription(String transcription) { this.transcription = transcription; }

    public static class SoapNote {
        private String s;
        private String o;
        private String a;
        private String p;

        public SoapNote() {}
        public SoapNote(String s, String o, String a, String p) {
            this.s = s;
            this.o = o;
            this.a = a;
            this.p = p;
        }

        public String getS() { return s; }
        public void setS(String s) { this.s = s; }

        public String getO() { return o; }
        public void setO(String o) { this.o = o; }

        public String getA() { return a; }
        public void setA(String a) { this.a = a; }

        public String getP() { return p; }
        public void setP(String p) { this.p = p; }
    }
}
