package com.scribehealth.service;

import com.scribehealth.model.User;

public interface DoctorProfileService {

    User getProfile(String email);

    User updateProfile(String email, String specialization, String licenseNumber);
}
