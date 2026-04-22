package com.scribehealth.service;

import com.scribehealth.model.ClinicalSession;
import java.util.List;

public interface SessionService {
    List<ClinicalSession> getSessionsByPatient(String patientId, String doctorId);
    ClinicalSession createSession(ClinicalSession session, String doctorId);
    ClinicalSession updateSession(String sessionId, ClinicalSession session, String doctorId);
    void deleteSession(String sessionId, String doctorId);
}
