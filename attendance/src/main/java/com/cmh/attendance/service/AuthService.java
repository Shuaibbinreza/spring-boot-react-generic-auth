package com.cmh.attendance.service;

import com.cmh.attendance.dto.response.AuthResponse;
import com.cmh.attendance.dto.response.UserProfileDto;
import com.cmh.attendance.dto.request.LoginRequest;
import com.cmh.attendance.dto.request.RefreshTokenRequest;
import com.cmh.attendance.dto.request.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest registerRequest);

    AuthResponse login(LoginRequest loginRequest);

    AuthResponse refreshToken(RefreshTokenRequest refreshTokenRequest);

    void logout(String username);

    UserProfileDto getCurrentUserProfile(String username);
}
