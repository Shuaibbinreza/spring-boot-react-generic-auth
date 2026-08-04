package com.cmh.attendance.service;

import com.cmh.attendance.dto.AttendanceResponse;
import com.cmh.attendance.dto.AttendanceSubmitRequest;
import com.cmh.attendance.dto.AttendanceSummaryResponse;
import com.cmh.attendance.entity.Attendance;
import com.cmh.attendance.entity.AttendanceStatus;
import com.cmh.attendance.entity.Group;
import com.cmh.attendance.entity.User;
import com.cmh.attendance.exception.ResourceNotFoundException;
import com.cmh.attendance.repository.AttendanceRepository;
import com.cmh.attendance.repository.GroupRepository;
import com.cmh.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;

    public AttendanceServiceImpl(AttendanceRepository attendanceRepository,
                                 UserRepository userRepository,
                                 GroupRepository groupRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    @Override
    @Transactional
    public AttendanceResponse submitAttendance(String username, AttendanceSubmitRequest request) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        LocalDate targetDate = request.getAttendanceDate() != null ? request.getAttendanceDate() : LocalDate.now();

        Group group = null;
        if (request.getGroupId() != null) {
            group = groupRepository.findById(request.getGroupId()).orElse(null);
        } else {
            List<Group> userGroups = groupRepository.findByMemberId(user.getId());
            if (!userGroups.isEmpty()) {
                group = userGroups.get(0);
            }
        }

        LocalDateTime checkInTime = LocalDateTime.now();
        AttendanceStatus evaluatedStatus = evaluateStatus(request.getStatus(), checkInTime, group);

        Optional<Attendance> existingOpt = attendanceRepository.findByUserAndAttendanceDate(user, targetDate);
        Attendance attendance;

        if (existingOpt.isPresent()) {
            attendance = existingOpt.get();
            attendance.setStatus(evaluatedStatus);
            attendance.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
            if (group != null) {
                attendance.setGroup(group);
            }
            attendance.setCheckInTime(checkInTime);
        } else {
            attendance = Attendance.builder()
                    .user(user)
                    .group(group)
                    .attendanceDate(targetDate)
                    .checkInTime(checkInTime)
                    .status(evaluatedStatus)
                    .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                    .build();
        }

        Attendance saved = attendanceRepository.save(attendance);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceResponse getTodayAttendance(String username) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        Optional<Attendance> attendanceOpt = attendanceRepository.findByUserAndAttendanceDate(user, LocalDate.now());
        return attendanceOpt.map(this::mapToResponse).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getMyAttendanceHistory(String username) {
        User user = userRepository.findByUsernameOrEmail(username, username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return attendanceRepository.findByUserOrderByAttendanceDateDesc(user).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AttendanceSummaryResponse getAttendanceSummary(Long groupId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<Attendance> records;
        String groupName = null;
        long totalMembers = userRepository.count();

        if (groupId != null) {
            Group group = groupRepository.findById(groupId)
                    .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));
            groupName = group.getName();
            totalMembers = group.getMembers().size();
            records = attendanceRepository.findByGroupIdAndDateBetween(groupId, start, end);
        } else {
            records = attendanceRepository.findByAttendanceDateBetweenOrderByAttendanceDateDesc(start, end);
        }

        long totalRecords = records.size();
        long presentCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        long absentCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
        long lateCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.LATE).count();
        long leaveCount = records.stream().filter(r -> r.getStatus() == AttendanceStatus.ON_LEAVE).count();

        double attendancePercentage = 0.0;
        if (totalRecords > 0) {
            attendancePercentage = ((double) (presentCount + lateCount) / totalRecords) * 100.0;
        }

        List<AttendanceResponse> responseRecords = records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return AttendanceSummaryResponse.builder()
                .groupId(groupId)
                .groupName(groupName)
                .startDate(start)
                .endDate(end)
                .totalMembers(totalMembers)
                .totalRecords(totalRecords)
                .presentCount(presentCount)
                .absentCount(absentCount)
                .lateCount(lateCount)
                .leaveCount(leaveCount)
                .attendancePercentage(Math.round(attendancePercentage * 10.0) / 10.0)
                .records(responseRecords)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getDetailedRecords(Long groupId, LocalDate startDate, LocalDate endDate) {
        LocalDate start = startDate != null ? startDate : LocalDate.now().minusDays(30);
        LocalDate end = endDate != null ? endDate : LocalDate.now();

        List<Attendance> records;
        if (groupId != null) {
            records = attendanceRepository.findByGroupIdAndDateBetween(groupId, start, end);
        } else {
            records = attendanceRepository.findByAttendanceDateBetweenOrderByAttendanceDateDesc(start, end);
        }

        return records.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private AttendanceResponse mapToResponse(Attendance a) {
        return AttendanceResponse.builder()
                .id(a.getId())
                .userId(a.getUser().getId())
                .username(a.getUser().getUsername())
                .fullName(a.getUser().getFullName())
                .groupId(a.getGroup() != null ? a.getGroup().getId() : null)
                .groupName(a.getGroup() != null ? a.getGroup().getName() : null)
                .attendanceDate(a.getAttendanceDate())
                .checkInTime(a.getCheckInTime())
                .status(a.getStatus())
                .notes(a.getNotes())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private AttendanceStatus evaluateStatus(AttendanceStatus requestedStatus, LocalDateTime checkInTime, Group group) {
        if (requestedStatus == AttendanceStatus.ON_LEAVE || requestedStatus == AttendanceStatus.ABSENT) {
            return requestedStatus;
        }

        if (group == null) {
            return requestedStatus;
        }

        java.time.DayOfWeek dayOfWeek = checkInTime.getDayOfWeek();

        String targetTimeStr;
        if (dayOfWeek == java.time.DayOfWeek.SATURDAY) {
            targetTimeStr = group.getSaturdayCheckInTime() != null ? group.getSaturdayCheckInTime() : "09:00";
        } else {
            targetTimeStr = group.getWeekdayCheckInTime() != null ? group.getWeekdayCheckInTime() : "08:00";
        }

        try {
            java.time.LocalTime cutoff = java.time.LocalTime.parse(targetTimeStr);
            if (checkInTime.toLocalTime().isAfter(cutoff)) {
                return AttendanceStatus.LATE;
            }
        } catch (Exception ex) {
            // Fallback gracefully on parsing issue
        }

        return requestedStatus;
    }
}
