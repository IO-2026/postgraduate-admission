package com.example.backend.model;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.example.backend.model.user.User;

public interface CohortRepository extends JpaRepository<Cohort, Long> {
    List<Cohort> findByCoordinator(User coordinator);
    List<Cohort> findByCourse(Course course);
}
