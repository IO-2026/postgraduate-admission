package com.example.backend.model.user.dto;

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
    private java.time.LocalDateTime submissionDateTime;
    private Boolean isWithdrawn;
    private Boolean isAccepted;
    private Boolean isWaitlisted;
    private Boolean isEntryFeePaid;
    private Boolean isDiplomaVerified;
    private Boolean isDeclarationVerified;
    private Boolean isSemesterPaid;
    private String telNumber;
    private String pesel;
    private LocalDate dateOfBirth;
}
