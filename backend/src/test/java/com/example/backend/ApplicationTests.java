package com.example.backend;

import java.util.HashMap;
import java.util.Map;

import com.example.backend.model.application.ApplicationMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;


import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.role.Role;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
import com.example.backend.security.JwtUtil;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.mock.web.MockMultipartFile;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Import(TestWebClientConfig.class)
public class ApplicationTests {

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
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ApplicationMapper applicationMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private Course testCourse;

    @BeforeEach
    void setUp() {
        Role candidateRole = roleRepository.findByName("Candidate").orElseGet(() -> {
            Role role = new Role();
            role.setName("Candidate");
            return roleRepository.save(role);
        });
        String email = "candidate.test@example.com";
        testUser = userRepository.findByEmail(email).orElseGet(() -> {
            User user = new User();
            user.setName("John");
            user.setSurname("Doe");
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode("Pass123!"));
            user.setTelNumber("123456789");
            user.setRole(candidateRole);
            return userRepository.save(user);
        });

        testCourse = new Course();
        testCourse.setName("Test Course");
        testCourse.setDescription("Description");
        testCourse.setPrice(100.0);
        courseRepository.save(testCourse);
    }

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void submitApplication_ShouldSucceed_WhenCandidateRole() throws Exception {
        String token = jwtUtil.generateToken(testUser);

        Map<String, Object> applicationData = new HashMap<>();
        applicationData.put("applicantDateOfBirth", "1990-01-01");
        applicationData.put("userId", testUser.getId());
        applicationData.put("applicantPesel", "90010101234");
        applicationData.put("addressStreet", "Adminowa 1");
        applicationData.put("addressPostalCode", "00-001");
        applicationData.put("addressCity", "Warszawa");
        applicationData.put("previousDegree", "Magister");
        applicationData.put("fieldOfStudy", "Zarządzanie");
        applicationData.put("graduationYear", 2015);
        applicationData.put("courseId", testCourse.getId());
        applicationData.put("university", "Test University");
        applicationData.put("truthfulnessConsent", true);
        applicationData.put("gdprConsent", true);

        MockMultipartFile diplomaFile = new MockMultipartFile(
                "diploma",
                "diploma.pdf",
                "application/pdf",
                "PDF test content".getBytes()
        );

        MockMultipartFile applicationPart = new MockMultipartFile(
                "application",
                "",
                "application/json",
                objectMapper.writeValueAsString(applicationData).getBytes()
        );

        mockMvc.perform(multipart("/api/applications/submit")
                        .file(diplomaFile)
                        .file(applicationPart)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());
    }

    @Test
    void submitApplication_ShouldFail_WhenWrongRole() throws Exception {
        Role adminRole = roleRepository.findByName("Admin").orElseGet(() -> {
            Role role = new Role();
            role.setName("Admin");
            return roleRepository.save(role);
        });
        User adminUser = new User();
        adminUser.setName("Admin");
        adminUser.setSurname("User");
        String uniqueEmail = "admin_" + System.currentTimeMillis() + "@example.com";
        adminUser.setEmail(uniqueEmail);
        adminUser.setPassword("Pass123!");
        adminUser.setTelNumber("123456789");
        adminUser.setRole(adminRole);
        userRepository.save(adminUser);

        String token = jwtUtil.generateToken(adminUser);

        Map<String, Object> applicationData = new HashMap<>();
        applicationData.put("applicantDateOfBirth", "1990-01-01");
        applicationData.put("applicantPesel", "90010101234");
        applicationData.put("addressStreet", "Adminowa 1");
        applicationData.put("addressPostalCode", "00-001");
        applicationData.put("addressCity", "Warszawa");
        applicationData.put("previousDegree", "Magister");
        applicationData.put("fieldOfStudy", "Zarządzanie");
        applicationData.put("graduationYear", 2015);
        applicationData.put("courseId", testCourse.getId());
        applicationData.put("university", "Test University");
        applicationData.put("truthfulnessConsent", true);
        applicationData.put("gdprConsent", true);

        MockMultipartFile diplomaFile = new MockMultipartFile(
                "diploma",
                "diploma.pdf",
                "application/pdf",
                "PDF test content".getBytes()
        );

        MockMultipartFile applicationPart = new MockMultipartFile(
                "application",
                "",
                "application/json",
                objectMapper.writeValueAsString(applicationData).getBytes()
        );

        mockMvc.perform(multipart("/api/applications/submit")
                        .file(diplomaFile)
                        .file(applicationPart)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void submitApplication_ShouldFail_WhenCandidateAlreadyApplied() throws Exception {
        String token = jwtUtil.generateToken(testUser);

        Map<String, Object> applicationData = new HashMap<>();
        applicationData.put("applicantDateOfBirth", "2000-01-01");
        applicationData.put("userId", testUser.getId());
        applicationData.put("applicantPesel", "44051401458");
        applicationData.put("addressStreet", "Testowa 1");
        applicationData.put("addressPostalCode", "30-059");
        applicationData.put("addressCity", "Kraków");
        applicationData.put("previousDegree", "Inżynier");
        applicationData.put("fieldOfStudy", "Informatyka");
        applicationData.put("graduationYear", 2020);
        applicationData.put("courseId", testCourse.getId());
        applicationData.put("university", "Test University");
        applicationData.put("truthfulnessConsent", true);
        applicationData.put("gdprConsent", true);

        MockMultipartFile diplomaFile = new MockMultipartFile(
                "diploma",
                "diploma.pdf",
                "application/pdf",
                "PDF test content".getBytes()
        );

        MockMultipartFile applicationPart = new MockMultipartFile(
                "application",
                "",
                "application/json",
                objectMapper.writeValueAsString(applicationData).getBytes()
        );

        // First submission should succeed
        mockMvc.perform(multipart("/api/applications/submit")
                        .file(diplomaFile)
                        .file(applicationPart)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isCreated());

        // Second submission with same user should fail
        diplomaFile = new MockMultipartFile(
                "diploma",
                "diploma2.pdf",
                "application/pdf",
                "PDF test content 2".getBytes()
        );

        applicationPart = new MockMultipartFile(
                "application",
                "",
                "application/json",
                objectMapper.writeValueAsString(applicationData).getBytes()
        );

        mockMvc.perform(multipart("/api/applications/submit")
                        .file(diplomaFile)
                        .file(applicationPart)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }
}
