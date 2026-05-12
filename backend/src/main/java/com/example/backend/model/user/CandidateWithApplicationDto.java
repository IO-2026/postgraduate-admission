package com.example.backend.model.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateWithApplicationDto {
    private Long id;
    private String name;
    private String surname;
    private String email;
    private long applicationId;
    private boolean isPaid;
    private String status;
    private String telNumber;
    private String pesel;
    private LocalDate dateOfBirth;
    private LocalDateTime submissionDateTime;
}
