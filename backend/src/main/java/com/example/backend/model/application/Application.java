package com.example.backend.model.application;


import com.example.backend.model.user.User;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Id;
import jakarta.persistence.FetchType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "diploma_url")
    private String diplomaUrl;

    @Column(name = "university")
    private String university;

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "is_paid")
    private Boolean isPaid = false;

    @Column(name = "applicant_date_of_birth")
    private LocalDate applicantDateOfBirth;

    @Column(name = "applicant_pesel")
    private String applicantPesel;

    @Column(name = "address_street")
    private String addressStreet;

    @Column(name = "address_postal_code")
    private String addressPostalCode;

    @Column(name = "address_city")
    private String addressCity;

    @Column(name = "previous_degree")
    private String previousDegree;

    @Column(name = "field_of_study")
    private String fieldOfStudy;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "notes", length = 2000)
    private String notes;

    @Column(name = "truthfulness_consent")
    private Boolean truthfulnessConsent;

    @Column(name = "gdpr_consent")
    private Boolean gdprConsent;

    @Enumerated(EnumType.STRING)
    @Column(name="status", nullable = false)
    private ApplicationStatus status;
}
