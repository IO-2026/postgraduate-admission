package com.example.backend;

import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.mockito.Mockito;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BackendApplication.class)
@Import({TestDynamicProperties.class, TestWebClientConfig.class})
@Transactional
public class AuthTests {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String TEST_EMAIL = "testuser@example.com";
    private static final String TEST_PASSWORD = "TestPassword123!";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        userRepository.deleteAll();
        roleRepository.deleteAll();
        Role candidateRole = new Role(1, "Candidate");
        roleRepository.save(candidateRole);

        User user = new User();
        user.setName("Jane");
        user.setSurname("Doe");
        user.setEmail(TEST_EMAIL);
        user.setPassword(passwordEncoder.encode(TEST_PASSWORD));
        user.setTelNumber("987654321");
        user.setRole(candidateRole);
        userRepository.save(user);
    }


    @Configuration
    static class TestMailConfig {
        @Bean
        @Primary
        JavaMailSender mailSender() {
            return Mockito.mock(JavaMailSender.class);
        }
    }


    // Registration tests

    @Test
    void registerUser_ShouldSucceed_WhenValidPayload() throws Exception {
        Map<String, Object> registerRequest = new HashMap<>();
        registerRequest.put("name", "John");
        registerRequest.put("surname", "Smith");
        String registerEmail = "john.smith." + System.currentTimeMillis() + "@example.com";
        registerRequest.put("email", registerEmail);
        registerRequest.put("password", "MyPassword!1");
        registerRequest.put("telNumber", "123456789");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        assertTrue(userRepository.findByEmail(registerEmail).isPresent());
    }

    @Test
    void registerUser_ShouldFail_WhenEmailAlreadyExists() throws Exception {
        Map<String, Object> registerRequest = new HashMap<>();
        registerRequest.put("email", TEST_EMAIL);
        registerRequest.put("name", "Duplicate");
        registerRequest.put("surname", "User");
        registerRequest.put("password", "Pass123!");
        registerRequest.put("telNumber", "123456789");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().is4xxClientError());
    }

    // Login tests

    @Test
    void loginUser_ShouldSucceed_WhenCredentialsAreValid() throws Exception {
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("email", TEST_EMAIL);
        loginRequest.put("password", TEST_PASSWORD);

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
        loginRequest.put("email", TEST_EMAIL);
        loginRequest.put("password", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }
}
