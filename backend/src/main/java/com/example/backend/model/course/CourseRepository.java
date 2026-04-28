package com.example.backend.model.course;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.model.user.User;
import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
    List<Course> findByCoordinator(User coordinator);
    List<Course> findByCoordinatorId(Long coordinatorId);
}
