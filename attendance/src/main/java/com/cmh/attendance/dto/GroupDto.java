package com.cmh.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupDto {
    private Long id;
    private String name;
    private String description;
    private String weekdayCheckInTime;
    private String saturdayCheckInTime;
    private String weekendDays;
    private int memberCount;
    private List<UserSummaryDto> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
