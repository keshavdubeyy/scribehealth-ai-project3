package com.scribehealth.service;

import com.scribehealth.model.DoctorProfile;
import com.scribehealth.model.User;
import com.scribehealth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.NoSuchElementException;

@Service
public class DoctorProfileServiceImpl implements DoctorProfileService {

    private final UserRepository userRepository;

    public DoctorProfileServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User getProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
    }

    @Override
    public User updateProfile(String email, String specialization, String licenseNumber) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (user.getDoctorProfile() == null) {
            user.setDoctorProfile(new DoctorProfile());
        }

        if (specialization != null) {
            user.getDoctorProfile().setSpecialization(specialization);
        }
        if (licenseNumber != null) {
            user.getDoctorProfile().setLicenseNumber(licenseNumber);
        }

        return userRepository.save(user);
    }
}
