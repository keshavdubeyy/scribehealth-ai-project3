package com.scribehealth.service;

import com.scribehealth.model.Patient;
import java.util.List;

public interface PatientService {
    List<Patient> getPatientsByDoctor(String email);
    Patient createPatient(String email, Patient patient);
    void deletePatient(String id);
}
