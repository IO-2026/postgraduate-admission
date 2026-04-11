package com.example.backend.security.DTO;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
