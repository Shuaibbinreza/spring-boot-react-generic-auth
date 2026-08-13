package com.cmh.attendance.controller;

import com.cmh.attendance.dto.response.ApiResponse;
import com.cmh.attendance.dto.response.AuthResponse;
import com.cmh.attendance.dto.response.UserProfileDto;
import com.cmh.attendance.dto.request.LoginRequest;
import com.cmh.attendance.dto.request.RefreshTokenRequest;
import com.cmh.attendance.dto.request.RegisterRequest;
import com.cmh.attendance.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        AuthResponse response = authService.register(registerRequest);
        ResponseCookie accessCookie = createAccessCookie(response.getAccessToken(), response.getExpiresIn());
        ResponseCookie refreshCookie = createRefreshCookie(response.getRefreshToken());

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success("User registered successfully", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        ResponseCookie accessCookie = createAccessCookie(response.getAccessToken(), response.getExpiresIn());
        ResponseCookie refreshCookie = createRefreshCookie(response.getRefreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success("User logged in successfully", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @RequestBody(required = false) RefreshTokenRequest refreshTokenRequest,
            HttpServletRequest request) {
        String tokenStr = (refreshTokenRequest != null) ? refreshTokenRequest.getRefreshToken() : null;
        if (tokenStr == null || tokenStr.trim().isEmpty()) {
            if (request.getCookies() != null) {
                for (Cookie cookie : request.getCookies()) {
                    if ("refreshToken".equals(cookie.getName())) {
                        tokenStr = cookie.getValue();
                        break;
                    }
                }
            }
        }

        if (tokenStr == null || tokenStr.trim().isEmpty()) {
            return new ResponseEntity<>(ApiResponse.error("Refresh token is missing"), HttpStatus.BAD_REQUEST);
        }

        AuthResponse response = authService.refreshToken(new RefreshTokenRequest(tokenStr));
        ResponseCookie accessCookie = createAccessCookie(response.getAccessToken(), response.getExpiresIn());
        ResponseCookie refreshCookie = createRefreshCookie(response.getRefreshToken());

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(ApiResponse.success("Token refreshed successfully", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logoutUser(Authentication authentication) {
        if (authentication != null) {
            authService.logout(authentication.getName());
        }
        ResponseCookie cleanAccessCookie = cleanCookie("accessToken", "/");
        ResponseCookie cleanRefreshCookie = cleanCookie("refreshToken", "/api/auth");

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cleanAccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, cleanRefreshCookie.toString())
                .body(ApiResponse.success("User logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return new ResponseEntity<>(ApiResponse.error("Unauthorized: Please log in"), HttpStatus.UNAUTHORIZED);
        }
        UserProfileDto profile = authService.getCurrentUserProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Current user profile retrieved", profile));
    }

    private ResponseCookie createAccessCookie(String token, long expiresInSeconds) {
        return ResponseCookie.from("accessToken", token)
                .httpOnly(true)
                .path("/")
                .maxAge(expiresInSeconds)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie createRefreshCookie(String token) {
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .path("/api/auth")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();
    }

    private ResponseCookie cleanCookie(String name, String path) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .path(path)
                .maxAge(0)
                .sameSite("Lax")
                .build();
    }
}
