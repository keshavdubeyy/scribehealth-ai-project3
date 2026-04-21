package com.scribehealth.service;

import com.scribehealth.dto.AuthResponse;
import com.scribehealth.dto.LoginRequest;
import com.scribehealth.dto.RegisterRequest;
import com.scribehealth.model.DoctorProfile;
import com.scribehealth.model.User;
import com.scribehealth.repository.UserRepository;
import com.scribehealth.util.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.NoSuchElementException;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil         jwtUtil;
    private final AuditService    auditService;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil,
                           AuditService auditService) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil         = jwtUtil;
        this.auditService    = auditService;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isActive()) {
            auditService.log(request.getEmail(), "login_failed", "user",
                    request.getEmail(), "{\"reason\":\"account_disabled\"}");
            throw new BadCredentialsException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            auditService.log(request.getEmail(), "login_failed", "user",
                    request.getEmail(), "{\"reason\":\"invalid_credentials\"}");
            throw new BadCredentialsException("Invalid email or password");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        auditService.log(request.getEmail(), "login_success", "user", request.getEmail());

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId());

        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole());
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
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
            DoctorProfile profile = new DoctorProfile(
                    request.getDoctorProfile().getSpecialization(),
                    request.getDoctorProfile().getLicenseNumber());
            user.setDoctorProfile(profile);
        }

        User saved = userRepository.save(user);

        auditService.log(saved.getEmail(), "user_registered", "user", saved.getId(),
                "{\"role\":\"" + saved.getRole().name() + "\"}");

        String token = jwtUtil.generateToken(
                saved.getEmail(),
                saved.getRole().name(),
                saved.getId());

        return new AuthResponse(token, saved.getName(), saved.getEmail(), saved.getRole());
    }

    @Override
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + email));
    }
}
