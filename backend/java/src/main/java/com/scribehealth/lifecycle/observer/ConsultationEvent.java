package com.scribehealth.lifecycle.observer;

public class ConsultationEvent {
    private final String sessionId;
    private final String doctorEmail;
    private final String fromStatus;
    private final String toStatus;

    public ConsultationEvent(String sessionId, String doctorEmail, String fromStatus, String toStatus) {
        this.sessionId   = sessionId;
        this.doctorEmail = doctorEmail;
        this.fromStatus  = fromStatus;
        this.toStatus    = toStatus;
    }

    public String getSessionId()   { return sessionId; }
    public String getDoctorEmail() { return doctorEmail; }
    public String getFromStatus()  { return fromStatus; }
    public String getToStatus()    { return toStatus; }
}
