package com.cmh.attendance.controller;

import com.cmh.attendance.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<String>> publicAccess() {
        return ResponseEntity.ok(ApiResponse.success("Public Content", "Public Content: Accessible by anyone."));
    }

    @GetMapping("/user")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> userAccess() {
        return ResponseEntity.ok(ApiResponse.success("User Content", "User Content: Accessible by authenticated users with ROLE_USER or ROLE_ADMIN."));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> adminAccess() {
        return ResponseEntity.ok(ApiResponse.success("Admin Content", "Admin Board: Accessible only by users with ROLE_ADMIN."));
    }
}
