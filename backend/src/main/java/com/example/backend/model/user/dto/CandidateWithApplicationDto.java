package com.example.backend.model.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Boolean isWithdrawn;
    private Boolean isAccepted;
    private Boolean isEntryFeePaid;
    private Boolean isDiplomaVerified;
    private Boolean isDeclarationVerified;
    private Boolean isSemesterPaid;
}
