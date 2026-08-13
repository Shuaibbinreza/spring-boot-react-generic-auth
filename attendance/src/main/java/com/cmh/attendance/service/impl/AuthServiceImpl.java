package com.cmh.attendance.service.impl;

import com.cmh.attendance.dto.response.ApiResponse;
import com.cmh.attendance.dto.response.AuthResponse;
import com.cmh.attendance.dto.response.AttendanceResponse;
import com.cmh.attendance.dto.response.AttendanceSummaryResponse;
import com.cmh.attendance.dto.response.GroupDto;
import com.cmh.attendance.dto.response.UserProfileDto;
import com.cmh.attendance.dto.response.UserSummaryDto;
import com.cmh.attendance.dto.request.LoginRequest;
import com.cmh.attendance.dto.request.RefreshTokenRequest;
import com.cmh.attendance.dto.request.RegisterRequest;
import com.cmh.attendance.dto.request.AttendanceSubmitRequest;
import com.cmh.attendance.dto.request.CreateGroupRequest;
import com.cmh.attendance.entity.RefreshToken;
import com.cmh.attendance.entity.Role;
import com.cmh.attendance.entity.User;
import com.cmh.attendance.exception.BadRequestException;
import com.cmh.attendance.exception.ResourceNotFoundException;
import com.cmh.attendance.exception.TokenRefreshException;
import com.cmh.attendance.repository.UserRepository;
import com.cmh.attendance.security.JwtTokenProvider;
import com.cmh.attendance.service.AuthService;
import com.cmh.attendance.service.RefreshTokenService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RefreshTokenService refreshTokenService;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider,
                           RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.refreshTokenService = refreshTokenService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {
        String trimmedUsername = registerRequest.getUsername().trim();
        String trimmedEmail = registerRequest.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(trimmedUsername)) {
            throw new BadRequestException("Username is already taken!");
        }

        if (userRepository.existsByEmail(trimmedEmail)) {
            throw new BadRequestException("Email Address already in use!");
        }

        Set<Role> roles = new HashSet<>();
        if (registerRequest.getRoles() != null && !registerRequest.getRoles().isEmpty()) {
            roles.addAll(registerRequest.getRoles());
        } else {
            roles.add(Role.ROLE_USER);
        }

        User user = User.builder()
                .username(trimmedUsername)
                .email(trimmedEmail)
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .fullName(registerRequest.getFullName() != null ? registerRequest.getFullName().trim() : null)
                .rank(registerRequest.getRank() != null ? registerRequest.getRank().trim() : null)
                .designation(registerRequest.getDesignation() != null ? registerRequest.getDesignation().trim() : null)
                .force(registerRequest.getForce() != null ? registerRequest.getForce().trim() : null)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);

        // Auto authenticate on successful registration
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        trimmedUsername,
                        registerRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String accessToken = tokenProvider.generateToken(authentication);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getId());

        Set<String> roleNames = savedUser.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toSet());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs() / 1000)
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .roles(roleNames)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest loginRequest) {
        String usernameOrEmail = loginRequest.getUsernameOrEmail().trim();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        usernameOrEmail,
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User", "usernameOrEmail", usernameOrEmail));

        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        Set<String> roleNames = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs() / 1000)
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roleNames)
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        String requestRefreshToken = refreshTokenRequest.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    List<String> roles = user.getRoles().stream()
                            .map(Enum::name)
                            .collect(Collectors.toList());

                    String accessToken = tokenProvider.generateTokenFromUsername(user.getUsername(), roles);
                    
                    return AuthResponse.builder()
                            .accessToken(accessToken)
                            .refreshToken(requestRefreshToken)
                            .tokenType("Bearer")
                            .expiresIn(tokenProvider.getExpirationMs() / 1000)
                            .username(user.getUsername())
                            .email(user.getEmail())
                            .fullName(user.getFullName())
                            .roles(new HashSet<>(roles))
                            .build();
                })
                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken, "Refresh token is not in database!"));
    }

    @Override
    @Transactional
    public void logout(String username) {
        User user = userRepository.findByUsernameOrEmail(username, username.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        refreshTokenService.deleteByUserId(user.getId());
        SecurityContextHolder.clearContext();
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .rank(user.getRank())
                .designation(user.getDesignation())
                .force(user.getForce())
                .roles(user.getRoles())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
