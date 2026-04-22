package com.scribehealth.service;

import com.scribehealth.model.Patient;
import java.util.List;

public interface PatientService {
    List<Patient> getPatientsByDoctor(String email);
    Patient getPatient(String patientId, String doctorEmail);
    Patient createPatient(String email, Patient patient);
    void deletePatient(String patientId, String doctorEmail);
}
