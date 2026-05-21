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
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter
@Setter
@Data
@NoArgsConstructor
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "diploma_bucket_key")
    private String diplomaBucketKey;

    @Column(name = "university")
    private String university;

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "candidate_place_of_birth")
    private String candidatePlaceOfBirth;

    @Column(name = "candidate_date_of_birth")
    private LocalDate candidateDateOfBirth;

    @Column(name = "candidate_pesel")
    private String candidatePesel;

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

    private Boolean newsletterConsent;

    @CreationTimestamp
    @Column(name = "submission_date")
    private LocalDateTime submissionDateTime;

    @Column(name = "is_withdrawn")
    private Boolean isWithdrawn = false;

    @Column(name = "is_accepted")
    private Boolean isAccepted = false;

    @Column(name = "is_waitlisted")
    private Boolean isWaitlisted = false;

    @Column(name = "is_entryfee_paid")
    private Boolean isEntryFeePaid = false;

    @Column(name = "is_diploma_verified")
    private Boolean isDiplomaVerified = false;

    @Column(name = "is_declaration_verified")
    private Boolean isDeclarationVerified = false;

    @Column(name = "is_semester_paid")
    private Boolean isSemesterPaid = false;
}
