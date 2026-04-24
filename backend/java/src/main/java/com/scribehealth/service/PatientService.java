package com.scribehealth.service;

import com.scribehealth.dto.CreatePatientRequest;
import com.scribehealth.dto.UpdatePatientRequest;
import com.scribehealth.model.Patient;

import java.util.List;

public interface PatientService {

    List<Patient> getPatientsForDoctor(String doctorEmail);

    Patient getPatient(String patientId, String doctorEmail);

    Patient getPatientForDoctor(String doctorEmail, String patientId);

    Patient createPatient(String doctorEmail, CreatePatientRequest request);

    Patient updatePatient(String doctorEmail, String patientId, UpdatePatientRequest request);

    void deletePatient(String doctorEmail, String patientId);
}
