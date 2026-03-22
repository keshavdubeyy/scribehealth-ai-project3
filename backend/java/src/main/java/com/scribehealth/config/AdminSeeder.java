package com.scribehealth.config;

import com.scribehealth.model.Role;
import com.scribehealth.model.User;
import com.scribehealth.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Runs once on startup.
 * If no ADMIN user exists, creates a default admin account.
 * Change the default password immediately after first login.
 */
@Component
public class AdminSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private static final String DEFAULT_ADMIN_EMAIL    = "admin@scribehealth.com";
    private static final String DEFAULT_ADMIN_PASSWORD = "Admin@12345";
    private static final String DEFAULT_ADMIN_NAME     = "System Admin";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean adminExists = userRepository.findAll()
                .stream()
                .anyMatch(u -> u.getRole() == Role.ADMIN);

        if (!adminExists) {
            User admin = new User();
            admin.setName(DEFAULT_ADMIN_NAME);
            admin.setEmail(DEFAULT_ADMIN_EMAIL);
            admin.setPasswordHash(passwordEncoder.encode(DEFAULT_ADMIN_PASSWORD));
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            admin.setCreatedAt(Instant.now());
            userRepository.save(admin);

            log.warn("========================================================");
            log.warn("  Default ADMIN account created:");
            log.warn("  Email   : {}", DEFAULT_ADMIN_EMAIL);
            log.warn("  Password: {}", DEFAULT_ADMIN_PASSWORD);
            log.warn("  ⚠️  Change this password immediately after first login!");
            log.warn("========================================================");
        } else {
            log.info("Admin account already exists — skipping seed.");
        }
    }
}
