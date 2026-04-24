package com.scribehealth.lifecycle.observer;

import com.scribehealth.service.AuditService;

public class AuditLoggerObserver implements ConsultationObserver {

    private final AuditService auditService;

    public AuditLoggerObserver(AuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    public void onEvent(ConsultationEvent event) {
        String action = switch (event.getToStatus()) {
            case "IN_PROGRESS"  -> "session_started";
            case "RECORDED"     -> "session_recorded";
            case "TRANSCRIBED"  -> "session_transcribed";
            case "UNDER_REVIEW" -> "note_ready";
            case "APPROVED"     -> "note_approved";
            case "REJECTED"     -> "note_rejected";
            default             -> "session_status_changed";
        };
        auditService.log(event.getDoctorEmail(), action, "session", event.getSessionId());
    }
}
