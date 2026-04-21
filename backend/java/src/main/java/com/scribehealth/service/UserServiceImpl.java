package com.scribehealth.service;

import com.scribehealth.model.Role;
import com.scribehealth.model.User;
import com.scribehealth.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
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
