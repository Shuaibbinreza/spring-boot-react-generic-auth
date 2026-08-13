package com.cmh.attendance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryResponse {
    private Long groupId;
    private String groupName;
    private LocalDate startDate;
    private LocalDate endDate;
    private long totalMembers;
    private long totalRecords;
    private long presentCount;
    private long absentCount;
    private long lateCount;
    private long leaveCount;
    private double attendancePercentage;
    private List<AttendanceResponse> records;
}
