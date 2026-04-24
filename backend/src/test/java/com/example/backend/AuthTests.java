package com.example.backend;

import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AuthTests {

    @Autowired
    private WebApplicationContext wac;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
        registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        registry.add("spring.datasource.username", () -> "sa");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.show-sql", () -> "false");
        registry.add("jwt.secret", () -> "01234567890123456789012345678901");
        registry.add("jwt.expiration", () -> "86400000");
        registry.add("spring.mail.host", () -> "localhost");
        registry.add("spring.mail.port", () -> "1025");
    }

    private Role testRole;

    @BeforeEach
    void setUp() {
        testRole = roleRepository.findById(1).orElse(null);

        User testUser = new User();
        testUser.setName("Jane");
        testUser.setSurname("Doe");
        testUser.setEmail("jane.doe@example.com");
        testUser.setPassword(passwordEncoder.encode("SecurePass123!"));
        testUser.setTelNumber("987654321");
        testUser.setRole(testRole);
        userRepository.save(testUser);
        this.mockMvc = MockMvcBuilders.webAppContextSetup(wac).build();
    }

    //Registration tests

    @Test
    void registerUser_ShouldSucceed_WhenValidPayload() throws Exception {
        Map<String, Object> registerRequest = new HashMap<>();
        registerRequest.put("name", "John");
        registerRequest.put("surname", "Smith");
        registerRequest.put("email", "john.smith@example.com");
        registerRequest.put("password", "MyPassword!1");
        registerRequest.put("telNumber", "123456789");
        registerRequest.put("roleId", testRole.getId());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        assertTrue(userRepository.findByEmail("john.smith@example.com").isPresent());
    }

    @Test
    void registerUser_ShouldFail_WhenEmailAlreadyExists() throws Exception {
        Map<String, Object> registerRequest = new HashMap<>();
        registerRequest.put("email", "jane.doe@example.com");
        registerRequest.put("name", "Duplicate");
        registerRequest.put("surname", "User");
        registerRequest.put("password", "Pass123!");
        registerRequest.put("roleId", testRole.getId());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void registerUser_ShouldFail_WhenRoleIdIsInvalid() throws Exception {
        Map<String, Object> registerRequest = new HashMap<>();
        registerRequest.put("name", "Invalid");
        registerRequest.put("surname", "Role");
        registerRequest.put("email", "invalid.role@example.com");
        registerRequest.put("password", "Pass123!");
        registerRequest.put("telNumber", "123456789");
        registerRequest.put("roleId", 9999L);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    //Login tests

    @Test
    void loginUser_ShouldSucceed_WhenCredentialsAreValid() throws Exception {
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("email", "jane.doe@example.com");
        loginRequest.put("password", "SecurePass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());
    }

    @Test
    void loginUser_ShouldFail_WhenUserDoesNotExist() throws Exception {
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("email", "ghost@example.com");
        loginRequest.put("password", "SomePassword123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginUser_ShouldFail_WhenPasswordIsIncorrect() throws Exception {
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("email", "jane.doe@example.com");
        loginRequest.put("password", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

}
