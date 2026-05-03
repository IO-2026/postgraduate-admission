package com.example.backend;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
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

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
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

        Map<String, Object> applicant = new HashMap<>();
        applicant.put("dateOfBirth", "2000-01-01");
        applicant.put("pesel", "44051401458");
        Map<String, String> address = new HashMap<>();
        address.put("street", "Testowa 1");
        address.put("postalCode", "30-059");
        address.put("city", "Kraków");
        applicant.put("address", address);

        Map<String, Object> education = new HashMap<>();
        education.put("previousDegree", "Inżynier");
        education.put("fieldOfStudy", "Informatyka");
        education.put("graduationYear", 2020);

        Map<String, Object> details = new HashMap<>();
        details.put("courseId", testCourse.getId());
        details.put("university", "Test University");
        details.put("diplomaUrl", "http://example.com/diploma.pdf");
        details.put("truthfulnessConsent", true);
        details.put("gdprConsent", true);

        Map<String, Object> request = new HashMap<>();
        request.put("applicant", applicant);
        request.put("education", education);
        request.put("details", details);

        mockMvc.perform(post("/api/applications/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
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

        Map<String, Object> applicant = new HashMap<>();
        applicant.put("dateOfBirth", "1990-01-01");
        applicant.put("pesel", "90010101234");
        Map<String, String> address = new HashMap<>();
        address.put("street", "Adminowa 1");
        address.put("postalCode", "00-001");
        address.put("city", "Warszawa");
        applicant.put("address", address);

        Map<String, Object> education = new HashMap<>();
        education.put("previousDegree", "Magister");
        education.put("fieldOfStudy", "Zarządzanie");
        education.put("graduationYear", 2015);

        Map<String, Object> details = new HashMap<>();
        details.put("courseId", testCourse.getId());
        details.put("university", "Test University");
        details.put("diplomaUrl", "http://example.com/diploma.pdf");
        details.put("truthfulnessConsent", true);
        details.put("gdprConsent", true);

        Map<String, Object> request = new HashMap<>();
        request.put("applicant", applicant);
        request.put("education", education);
        request.put("details", details);

        mockMvc.perform(post("/api/applications/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void submitApplication_ShouldFail_WhenCandidateAlreadyApplied() throws Exception {
        String token = jwtUtil.generateToken(testUser);

        Map<String, Object> applicant = new HashMap<>();
        applicant.put("dateOfBirth", "2000-01-01");
        applicant.put("pesel", "44051401458");
        Map<String, String> address = new HashMap<>();
        address.put("street", "Testowa 1");
        address.put("postalCode", "30-059");
        address.put("city", "Kraków");
        applicant.put("address", address);

        Map<String, Object> education = new HashMap<>();
        education.put("previousDegree", "Inżynier");
        education.put("fieldOfStudy", "Informatyka");
        education.put("graduationYear", 2020);

        Map<String, Object> details = new HashMap<>();
        details.put("courseId", testCourse.getId());
        details.put("university", "Test University");
        details.put("diplomaUrl", "http://example.com/diploma.pdf");
        details.put("truthfulnessConsent", true);
        details.put("gdprConsent", true);

        Map<String, Object> request = new HashMap<>();
        request.put("applicant", applicant);
        request.put("education", education);
        request.put("details", details);

        String jsonRequest = objectMapper.writeValueAsString(request);

        mockMvc.perform(post("/api/applications/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/applications/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonRequest))
                .andExpect(status().isBadRequest());
    }
}
