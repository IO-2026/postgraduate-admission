package com.example.backend.model.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByUserId(Long userId);

    List<Application> findByCourseIdOrderBySubmissionDateTimeAscIdAsc(Long courseId);

    long countByCourseIdAndIsAcceptedTrueAndIsWithdrawnFalse(Long courseId);

    Optional<Application> findFirstByCourseIdAndIsWaitlistedTrueAndIsWithdrawnFalseOrderBySubmissionDateTimeAscIdAsc(
            Long courseId
    );
}
