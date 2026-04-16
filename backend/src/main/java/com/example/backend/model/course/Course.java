package com.example.backend.model.course;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Double price;

    @Column(name = "recruitment_start", nullable = false)
    private java.time.LocalDate recruitmentStart = java.time.LocalDate.now();

    @Column(name = "recruitment_end", nullable = false)
    private java.time.LocalDate recruitmentEnd = java.time.LocalDate.now().plusMonths(3);

    @Column(name = "coordinator_id", nullable = false)
    private Long coordinatorId = 1L;
}
