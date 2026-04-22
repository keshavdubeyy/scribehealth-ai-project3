package com.scribehealth.service;

import com.scribehealth.model.ClinicalSession;
import java.util.List;

public interface SessionService {
    List<ClinicalSession> getSessionsByDoctor(String email);
    List<ClinicalSession> getSessionsByPatient(String doctorEmail, String patientId);
    ClinicalSession createSession(String email, ClinicalSession session);
    ClinicalSession updateSession(String email, String id, ClinicalSession session);
    void deleteSession(String id);
}
