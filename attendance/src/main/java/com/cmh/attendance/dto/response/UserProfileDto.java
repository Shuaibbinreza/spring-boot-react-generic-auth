package com.cmh.attendance.dto.response;

import com.cmh.attendance.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileDto {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String rank;
    private String designation;
    private String force;
    private Set<Role> roles;
    private LocalDateTime createdAt;
}
