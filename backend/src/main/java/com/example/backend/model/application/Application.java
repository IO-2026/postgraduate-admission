package com.example.backend.model.application;


import com.example.backend.model.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

}
