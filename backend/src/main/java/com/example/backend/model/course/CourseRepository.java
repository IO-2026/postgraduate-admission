package com.example.backend.model.course;


import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseRepository extends JpaRepository<Course, Long> {
    java.util.List<Course> findByCoordinator(com.example.backend.model.user.User coordinator);
    java.util.List<Course> findByCoordinatorId(Long coordinatorId);
}
