package com.cmh.attendance.dto;

import com.cmh.attendance.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private Long id;
    private Long userId;
    private String username;
    private String fullName;
    private Long groupId;
    private String groupName;
    private LocalDate attendanceDate;
    private LocalDateTime checkInTime;
    private AttendanceStatus status;
    private String notes;
    private LocalDateTime createdAt;
}
