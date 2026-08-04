package com.cmh.attendance.service;

import com.cmh.attendance.dto.AttendanceResponse;
import com.cmh.attendance.dto.AttendanceSubmitRequest;
import com.cmh.attendance.dto.AttendanceSummaryResponse;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {
    AttendanceResponse submitAttendance(String username, AttendanceSubmitRequest request);
    AttendanceResponse getTodayAttendance(String username);
    List<AttendanceResponse> getMyAttendanceHistory(String username);
    AttendanceSummaryResponse getAttendanceSummary(Long groupId, LocalDate startDate, LocalDate endDate);
    List<AttendanceResponse> getDetailedRecords(Long groupId, LocalDate startDate, LocalDate endDate);
}
