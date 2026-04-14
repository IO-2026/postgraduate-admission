package com.example.backend.auth.DTO;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Data
public class ApplicationRequest {
    private Long userId;
    private String university;
    private String diplomaUrl;
    private Long courseId;
}
