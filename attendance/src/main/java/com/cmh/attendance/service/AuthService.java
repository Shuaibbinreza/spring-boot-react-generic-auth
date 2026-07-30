package com.cmh.attendance.service;

import com.cmh.attendance.dto.*;

public interface AuthService {

    AuthResponse register(RegisterRequest registerRequest);

    AuthResponse login(LoginRequest loginRequest);

    AuthResponse refreshToken(RefreshTokenRequest refreshTokenRequest);

    void logout(String username);

    UserProfileDto getCurrentUserProfile(String username);
}
