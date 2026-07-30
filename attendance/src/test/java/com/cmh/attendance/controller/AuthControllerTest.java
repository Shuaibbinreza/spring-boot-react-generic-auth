package com.cmh.attendance.controller;

import com.cmh.attendance.dto.LoginRequest;
import com.cmh.attendance.dto.RefreshTokenRequest;
import com.cmh.attendance.dto.RegisterRequest;
import com.cmh.attendance.entity.Role;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testRegisterUser_Success() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "john_doe",
                "john@example.com",
                "password123",
                "John Doe",
                Set.of(Role.ROLE_USER)
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andExpect(jsonPath("$.data.username").value("john_doe"))
                .andExpect(jsonPath("$.data.roles[0]").value("ROLE_USER"));
    }

    @Test
    void testRegisterUser_DuplicateUsername() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "john_doe",
                "john@example.com",
                "password123",
                "John Doe",
                Set.of(Role.ROLE_USER)
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));

        RegisterRequest duplicateRequest = new RegisterRequest(
                "john_doe",
                "john2@example.com",
                "password123",
                "John Doe 2",
                Set.of(Role.ROLE_USER)
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Username is already taken!"));
    }

    @Test
    void testLogin_Success() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "alice",
                "alice@example.com",
                "secret123",
                "Alice Wonder",
                Set.of(Role.ROLE_USER)
        );
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        LoginRequest loginRequest = new LoginRequest("alice", "secret123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.username").value("alice"));
    }

    @Test
    void testLogin_InvalidCredentials() throws Exception {
        LoginRequest loginRequest = new LoginRequest("nonexistent", "wrongpass");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testProtectedEndpoint_WithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testProtectedEndpoint_WithValidToken() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "bob",
                "bob@example.com",
                "password123",
                "Bob Builder",
                Set.of(Role.ROLE_USER)
        );

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String token = responseNode.get("data").get("accessToken").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("bob"))
                .andExpect(jsonPath("$.data.email").value("bob@example.com"));
    }

    @Test
    void testRoleBasedAccess_UserRole_DeniedAdminEndpoint() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "user_only",
                "user@example.com",
                "password123",
                "Regular User",
                Set.of(Role.ROLE_USER)
        );

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String token = responseNode.get("data").get("accessToken").asText();

        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void testRoleBasedAccess_AdminRole_AllowedAdminEndpoint() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "admin_user",
                "admin@example.com",
                "password123",
                "Admin User",
                Set.of(Role.ROLE_ADMIN)
        );

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String token = responseNode.get("data").get("accessToken").asText();

        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("Admin Board: Accessible only by users with ROLE_ADMIN."));
    }

    @Test
    void testRefreshToken_Success() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "refresh_user",
                "refresh@example.com",
                "password123",
                "Refresh Test",
                Set.of(Role.ROLE_USER)
        );

        MvcResult regResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andReturn();

        JsonNode responseNode = objectMapper.readTree(regResult.getResponse().getContentAsString());
        String refreshToken = responseNode.get("data").get("refreshToken").asText();

        RefreshTokenRequest refreshReq = new RefreshTokenRequest(refreshToken);

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andExpect(jsonPath("$.data.refreshToken").value(refreshToken));
    }
}
