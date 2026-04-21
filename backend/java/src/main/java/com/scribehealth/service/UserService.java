package com.scribehealth.service;

import com.scribehealth.model.User;

import java.util.List;
import java.util.Map;

public interface UserService {

    List<User> getAllUsers();

    User getUser(String id);

    User activateUser(String id);

    User deactivateUser(String id);

    Map<String, Long> getStats();
}
