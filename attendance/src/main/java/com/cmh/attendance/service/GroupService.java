package com.cmh.attendance.service;

import com.cmh.attendance.dto.request.CreateGroupRequest;
import com.cmh.attendance.dto.response.GroupDto;

import java.util.List;

public interface GroupService {
    List<GroupDto> getAllGroups();
    GroupDto getGroupById(Long groupId);
    GroupDto createGroup(CreateGroupRequest request);
    GroupDto updateGroup(Long groupId, CreateGroupRequest request);
    void deleteGroup(Long groupId);
    GroupDto addUserToGroup(Long groupId, Long userId);
    GroupDto removeUserFromGroup(Long groupId, Long userId);
}
