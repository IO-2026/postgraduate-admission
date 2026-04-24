package com.example.backend.controller;

import com.example.backend.service.AdminService;
import com.example.backend.dto.AssignRequest;
import com.example.backend.dto.AssignmentDto;
import com.example.backend.dto.CoordinatorDto;
import com.example.backend.dto.CoordinatorWithCohortsDto;
import com.example.backend.dto.UserDto;

import com.example.backend.model.Course;
import com.example.backend.model.Cohort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/courses")
    public ResponseEntity<List<Course>> getCourses() {
        return ResponseEntity.ok(adminService.getAllCourses());
    }

    @GetMapping("/cohorts")
    public ResponseEntity<List<Cohort>> getCohorts() {
        return ResponseEntity.ok(adminService.getAllCohorts());
    }

    @GetMapping("/admin/coordinators")
    public ResponseEntity<List<CoordinatorDto>> getCoordinators() {
        return ResponseEntity.ok(adminService.getCoordinatorsDto());
    }

    @PostMapping("/admin/assign-coordinator")
    public ResponseEntity<?> assignCoordinator(@RequestBody AssignRequest request) {
        try {
            AssignmentDto dto = adminService.assignCoordinator(request.getCoordinatorId(), request.getCourseId(), request.getCohortId());
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin/assignments")
    public ResponseEntity<List<AssignmentDto>> getAssignments() {
        return ResponseEntity.ok(adminService.getAssignments());
    }

    @DeleteMapping("/admin/assignments/{id}")
    public ResponseEntity<?> deleteAssignment(@PathVariable("id") Long id) {
        try {
            adminService.unassignCohort(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/admin/courses/{id}/coordinator")
    public ResponseEntity<?> assignCourseCoordinator(@PathVariable("id") Long id, @RequestBody AssignRequest request) {
        try {
            Course saved = adminService.assignCourseCoordinator(id, request.getCoordinatorId());
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }



    @GetMapping("/admin/coordinators-with-cohorts")
    public ResponseEntity<List<CoordinatorWithCohortsDto>> getCoordinatorsWithCohorts() {
        return ResponseEntity.ok(adminService.getCoordinatorsWithCohorts());
    }

    @DeleteMapping("/admin/cohorts/{id}/coordinator")
    public ResponseEntity<?> unassignCohortCoordinator(@PathVariable("id") Long id) {
        try {
            adminService.unassignCohort(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/admin/users/{id}/promote")
    public ResponseEntity<?> promoteUser(@PathVariable("id") Long id) {
        try {
            UserDto dto = adminService.promoteUserToCoordinator(id);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/admin/users/{id}/demote")
    public ResponseEntity<?> demoteUser(@PathVariable("id") Long id) {
        try {
            UserDto dto = adminService.demoteUserToApplicant(id);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin/users/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam(value = "q", required = false) String q) {
        return ResponseEntity.ok(adminService.searchUsers(q));
    }
}
