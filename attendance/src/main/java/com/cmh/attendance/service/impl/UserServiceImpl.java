package com.cmh.attendance.service.impl;

import com.cmh.attendance.dto.response.UserSummaryDto;
import com.cmh.attendance.entity.User;
import com.cmh.attendance.exception.ResourceNotFoundException;
import com.cmh.attendance.repository.UserRepository;
import com.cmh.attendance.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToSummaryDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryDto getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToSummaryDto(user);
    }

    private UserSummaryDto mapToSummaryDto(User user) {
        return UserSummaryDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .rank(user.getRank())
                .designation(user.getDesignation())
                .force(user.getForce())
                .roles(user.getRoles())
                .build();
    }
}
