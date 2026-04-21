package com.scribehealth.service;

import com.scribehealth.dto.RegisterRequest;
import com.scribehealth.model.DoctorProfile;
import com.scribehealth.model.Role;
import com.scribehealth.model.User;
import com.scribehealth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User getUser(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + id));
    }

    @Override
    public User createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalStateException(
                    "An account with email " + request.getEmail() + " already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);
        user.setCreatedAt(Instant.now());

        if (request.getDoctorProfile() != null) {
            user.setDoctorProfile(new DoctorProfile(
                    request.getDoctorProfile().getSpecialization(),
                    request.getDoctorProfile().getLicenseNumber()));
        }

        return userRepository.save(user);
    }

    @Override
    public User activateUser(String id) {
        User user = getUser(id);
        user.setActive(true);
        return userRepository.save(user);
    }

    @Override
    public User deactivateUser(String id) {
        User user = getUser(id);
        user.setActive(false);
        return userRepository.save(user);
    }

    @Override
    public Map<String, Long> getStats() {
        List<User> all = userRepository.findAll();
        return Map.of(
                "totalUsers",   (long) all.size(),
                "totalDoctors", all.stream().filter(u -> u.getRole() == Role.DOCTOR).count(),
                "totalAdmins",  all.stream().filter(u -> u.getRole() == Role.ADMIN).count(),
                "activeUsers",  all.stream().filter(User::isActive).count()
        );
    }
}
