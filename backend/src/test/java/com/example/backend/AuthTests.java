package com.example.backend;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import org.mockito.Mockito;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.model.notification.EmailService;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;

import tools.jackson.databind.ObjectMapper;

@SpringBootTest(classes = BackendApplication.class)
@AutoConfigureMockMvc
@Transactional
@Import(AuthTests.TestMailConfig.class)
public class AuthTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private EmailService emailService;
  
    @Configuration
    static class TestMailConfig {
        @Bean
        @Primary
        JavaMailSender mailSender() {
            return Mockito.mock(JavaMailSender.class);
        }
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
