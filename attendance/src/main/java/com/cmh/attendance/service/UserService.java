package com.cmh.attendance.service;

import com.cmh.attendance.dto.UserSummaryDto;

import java.util.List;

public interface UserService {
    List<UserSummaryDto> getAllUsers();
    UserSummaryDto getUserById(Long userId);
}
