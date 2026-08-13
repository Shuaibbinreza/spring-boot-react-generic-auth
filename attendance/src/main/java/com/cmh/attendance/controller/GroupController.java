package com.cmh.attendance.controller;

import com.cmh.attendance.dto.response.ApiResponse;
import com.cmh.attendance.dto.request.CreateGroupRequest;
import com.cmh.attendance.dto.response.GroupDto;
import com.cmh.attendance.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/groups")
@PreAuthorize("hasRole('ADMIN')")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GroupDto>>> getAllGroups() {
        List<GroupDto> groups = groupService.getAllGroups();
        return ResponseEntity.ok(ApiResponse.success("Groups retrieved successfully", groups));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupDto>> getGroupById(@PathVariable Long id) {
        GroupDto group = groupService.getGroupById(id);
        return ResponseEntity.ok(ApiResponse.success("Group retrieved successfully", group));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GroupDto>> createGroup(@Valid @RequestBody CreateGroupRequest request) {
        GroupDto created = groupService.createGroup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GroupDto>> updateGroup(@PathVariable Long id,
                                                             @Valid @RequestBody CreateGroupRequest request) {
        GroupDto updated = groupService.updateGroup(id, request);
        return ResponseEntity.ok(ApiResponse.success("Group updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(@PathVariable Long id) {
        groupService.deleteGroup(id);
        return ResponseEntity.ok(ApiResponse.success("Group deleted successfully", null));
    }

    @PostMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<GroupDto>> addUserToGroup(@PathVariable Long id,
                                                                 @PathVariable Long userId) {
        GroupDto updated = groupService.addUserToGroup(id, userId);
        return ResponseEntity.ok(ApiResponse.success("User added to group successfully", updated));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ApiResponse<GroupDto>> removeUserFromGroup(@PathVariable Long id,
                                                                      @PathVariable Long userId) {
        GroupDto updated = groupService.removeUserFromGroup(id, userId);
        return ResponseEntity.ok(ApiResponse.success("User removed from group successfully", updated));
    }
}
