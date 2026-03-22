package com.scribehealth.service;

import com.scribehealth.dto.AuthResponse;
import com.scribehealth.dto.LoginRequest;
import com.scribehealth.dto.RegisterRequest;
import com.scribehealth.model.User;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    User getCurrentUser(String email);
}
