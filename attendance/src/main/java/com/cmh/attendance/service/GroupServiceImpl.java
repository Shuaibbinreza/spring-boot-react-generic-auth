package com.cmh.attendance.service;

import com.cmh.attendance.dto.CreateGroupRequest;
import com.cmh.attendance.dto.GroupDto;
import com.cmh.attendance.dto.UserSummaryDto;
import com.cmh.attendance.entity.Group;
import com.cmh.attendance.entity.User;
import com.cmh.attendance.exception.BadRequestException;
import com.cmh.attendance.exception.ResourceNotFoundException;
import com.cmh.attendance.repository.GroupRepository;
import com.cmh.attendance.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public GroupServiceImpl(GroupRepository groupRepository, UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<GroupDto> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public GroupDto getGroupById(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));
        return mapToDto(group);
    }

    @Override
    @Transactional
    public GroupDto createGroup(CreateGroupRequest request) {
        String trimmedName = request.getName().trim();
        if (groupRepository.existsByName(trimmedName)) {
            throw new BadRequestException("Group name '" + trimmedName + "' is already in use");
        }

        Group.GroupBuilder groupBuilder = Group.builder()
                .name(trimmedName)
                .description(request.getDescription() != null ? request.getDescription().trim() : null);

        if (request.getWeekdayCheckInTime() != null && !request.getWeekdayCheckInTime().isBlank()) {
            groupBuilder.weekdayCheckInTime(request.getWeekdayCheckInTime().trim());
        }
        if (request.getSaturdayCheckInTime() != null && !request.getSaturdayCheckInTime().isBlank()) {
            groupBuilder.saturdayCheckInTime(request.getSaturdayCheckInTime().trim());
        }
        if (request.getWeekendDays() != null && !request.getWeekendDays().isBlank()) {
            groupBuilder.weekendDays(request.getWeekendDays().trim());
        }

        Group savedGroup = groupRepository.save(groupBuilder.build());
        return mapToDto(savedGroup);
    }

    @Override
    @Transactional
    public GroupDto updateGroup(Long groupId, CreateGroupRequest request) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        String trimmedName = request.getName().trim();
        if (!group.getName().equalsIgnoreCase(trimmedName) && groupRepository.existsByName(trimmedName)) {
            throw new BadRequestException("Group name '" + trimmedName + "' is already in use");
        }

        group.setName(trimmedName);
        group.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);

        if (request.getWeekdayCheckInTime() != null && !request.getWeekdayCheckInTime().isBlank()) {
            group.setWeekdayCheckInTime(request.getWeekdayCheckInTime().trim());
        }
        if (request.getSaturdayCheckInTime() != null && !request.getSaturdayCheckInTime().isBlank()) {
            group.setSaturdayCheckInTime(request.getSaturdayCheckInTime().trim());
        }
        if (request.getWeekendDays() != null && !request.getWeekendDays().isBlank()) {
            group.setWeekendDays(request.getWeekendDays().trim());
        }

        Group updatedGroup = groupRepository.save(group);
        return mapToDto(updatedGroup);
    }

    @Override
    @Transactional
    public void deleteGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));
        groupRepository.delete(group);
    }

    @Override
    @Transactional
    public GroupDto addUserToGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        group.getMembers().add(user);
        Group updatedGroup = groupRepository.save(group);
        return mapToDto(updatedGroup);
    }

    @Override
    @Transactional
    public GroupDto removeUserFromGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        group.getMembers().remove(user);
        Group updatedGroup = groupRepository.save(group);
        return mapToDto(updatedGroup);
    }

    private GroupDto mapToDto(Group group) {
        List<UserSummaryDto> memberDtos = group.getMembers().stream()
                .map(u -> UserSummaryDto.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .fullName(u.getFullName())
                        .roles(u.getRoles())
                        .build())
                .collect(Collectors.toList());

        return GroupDto.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .weekdayCheckInTime(group.getWeekdayCheckInTime() != null ? group.getWeekdayCheckInTime() : "08:00")
                .saturdayCheckInTime(group.getSaturdayCheckInTime() != null ? group.getSaturdayCheckInTime() : "09:00")
                .weekendDays(group.getWeekendDays() != null ? group.getWeekendDays() : "FRIDAY")
                .memberCount(group.getMembers().size())
                .members(memberDtos)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
