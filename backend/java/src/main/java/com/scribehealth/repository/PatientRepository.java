package com.scribehealth.repository;

import com.scribehealth.model.Patient;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PatientRepository extends MongoRepository<Patient, String> {
    List<com.scribehealth.model.Patient> findByDoctorId(String doctorId);
}
