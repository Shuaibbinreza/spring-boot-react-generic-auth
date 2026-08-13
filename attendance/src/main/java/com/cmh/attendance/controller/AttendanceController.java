package com.cmh.attendance.controller;

import com.cmh.attendance.dto.response.ApiResponse;
import com.cmh.attendance.dto.response.AttendanceResponse;
import com.cmh.attendance.dto.request.AttendanceSubmitRequest;
import com.cmh.attendance.dto.response.AttendanceSummaryResponse;
import com.cmh.attendance.dto.response.GroupDto;
import com.cmh.attendance.service.AttendanceService;
import com.cmh.attendance.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final GroupService groupService;

    public AttendanceController(AttendanceService attendanceService, GroupService groupService) {
        this.attendanceService = attendanceService;
        this.groupService = groupService;
    }

    @GetMapping("/groups")
    public ResponseEntity<ApiResponse<List<GroupDto>>> getAvailableGroups() {
        List<GroupDto> groups = groupService.getAllGroups();
        return ResponseEntity.ok(ApiResponse.success("Available groups retrieved successfully", groups));
    }

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<AttendanceResponse>> submitAttendance(@Valid @RequestBody AttendanceSubmitRequest request,
                                                                             Authentication authentication) {
        String username = authentication.getName();
        AttendanceResponse response = attendanceService.submitAttendance(username, request);
        return ResponseEntity.ok(ApiResponse.success("Attendance submitted successfully", response));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<AttendanceResponse>> getTodayAttendance(Authentication authentication) {
        String username = authentication.getName();
        AttendanceResponse response = attendanceService.getTodayAttendance(username);
        return ResponseEntity.ok(ApiResponse.success("Today's attendance retrieved successfully", response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyAttendance(Authentication authentication) {
        String username = authentication.getName();
        List<AttendanceResponse> history = attendanceService.getMyAttendanceHistory(username);
        return ResponseEntity.ok(ApiResponse.success("Attendance history retrieved successfully", history));
    }

    @GetMapping("/admin/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceSummaryResponse>> getAttendanceSummary(
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        AttendanceSummaryResponse summary = attendanceService.getAttendanceSummary(groupId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Attendance summary retrieved successfully", summary));
    }

    @GetMapping("/admin/records")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getDetailedRecords(
            @RequestParam(required = false) Long groupId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<AttendanceResponse> records = attendanceService.getDetailedRecords(groupId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Detailed attendance records retrieved successfully", records));
    }
}
