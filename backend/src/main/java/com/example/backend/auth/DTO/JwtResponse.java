package com.example.backend.auth.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private Long id;
    private String email;
    private String role;
    private String name;
    private String surname;
    private String telNumber;
}
