package com.example.backend;

import com.example.backend.BackendApplication;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(classes = BackendApplication.class)
@Transactional
public class AuthTests {

    @org.springframework.test.context.DynamicPropertySource
    static void dynamicProperties(org.springframework.test.context.DynamicPropertyRegistry registry) {
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
        testRole = roleRepository.findByName("Candidate").orElseGet(() -> {
            Role role = new Role();
            role.setName("Candidate");
            return roleRepository.save(role);
        });

        User testUser = new User();
        testUser.setName("Jane");
        testUser.setSurname("Doe");
        testUser.setEmail("jane.doe@example.com");
        testUser.setPassword(passwordEncoder.encode("SecurePass123!"));
        testUser.setTelNumber("987654321");
        testUser.setRole(testRole);
        userRepository.save(testUser);
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
