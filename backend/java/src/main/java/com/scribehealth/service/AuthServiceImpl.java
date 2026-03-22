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

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse login(LoginRequest request) {

        // TODO: add audit log call here

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId()
        );

        return new AuthResponse(token, user.getName(), user.getEmail(), user.getRole());
    }

    @Override
    public AuthResponse register(RegisterRequest request) {

        // TODO: add audit log call here
        // TODO: add email notification on registration

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
                    request.getDoctorProfile().getLicenseNumber()
            );
            user.setDoctorProfile(profile);
        }

        User saved = userRepository.save(user);

        String token = jwtUtil.generateToken(
                saved.getEmail(),
                saved.getRole().name(),
                saved.getId()
        );

        return new AuthResponse(token, saved.getName(), saved.getEmail(), saved.getRole());
    }

    @Override
    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + email));
    }
}
