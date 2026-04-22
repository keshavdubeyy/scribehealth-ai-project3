package com.scribehealth.service;

import com.scribehealth.model.Patient;
import java.util.List;

public interface PatientService {
    List<Patient> getPatientsByDoctor(String doctorId);
    Patient getPatient(String patientId, String doctorId);
    Patient createPatient(Patient patient, String doctorId);
    void deletePatient(String patientId, String doctorId);
}
