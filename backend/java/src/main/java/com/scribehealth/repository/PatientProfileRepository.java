package com.scribehealth.repository;

import com.scribehealth.model.PatientProfile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PatientProfileRepository extends MongoRepository<PatientProfile, String> {
    List<PatientProfile> findByCreatedByDoctorEmailOrderByCreatedAtDesc(String doctorEmail);
}