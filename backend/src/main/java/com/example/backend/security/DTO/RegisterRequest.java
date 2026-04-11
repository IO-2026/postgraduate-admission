package com.example.backend.security.DTO;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String surname;
    private String email;
    private String password;
    private String telNumber;
    private Integer roleId;
}
