package com.example.backend.model.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateWithApplicationDto {
    private Long id;
    private String name;
    private String surname;
    private String email;
    private boolean isPaid;
    private String status;
}
