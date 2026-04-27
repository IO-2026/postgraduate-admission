package com.example.backend;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.transaction.annotation.Transactional;

import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.role.Role;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
import com.example.backend.security.JwtUtil;

import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ApplicationTests {

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

    @MockitoBean
    private EmailService emailService;

    private User testUser;
    private Course testCourse;

    @BeforeEach
    void setUp() {
        Role candidateRole = roleRepository.findByName("CANDIDATE").orElseGet(() -> {
            Role role = new Role(3, "CANDIDATE");
            return roleRepository.save(role);
        });

        testUser = new User();
        testUser.setName("John");
        testUser.setSurname("Doe");
        testUser.setEmail("candidate@example.com");
        testUser.setPassword("Pass123!");
        testUser.setTelNumber("123456789");
        testUser.setRole(candidateRole);
        userRepository.save(testUser);

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

        Map<String, Object> request = new HashMap<>();
        request.put("userId", testUser.getId());
        request.put("university", "Test University");
        request.put("courseId", testCourse.getId());
        request.put("diplomaUrl", "http://example.com/diploma.pdf");

        mockMvc.perform(post("/api/applications/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void submitApplication_ShouldFail_WhenWrongRole() throws Exception {
        Role adminRole = roleRepository.findByName("ADMIN").orElseGet(() -> {
            Role role = new Role(1, "ADMIN");
            return roleRepository.save(role);
        });
        User adminUser = new User();
        adminUser.setName("Admin");
        adminUser.setSurname("User");
        adminUser.setEmail("admin_unique_test_123@example.com");
        adminUser.setPassword("Pass123!");
        adminUser.setTelNumber("123456789");
        adminUser.setRole(adminRole);
        userRepository.save(adminUser);

        String token = jwtUtil.generateToken(adminUser);

        Map<String, Object> request = new HashMap<>();
        request.put("userId", adminUser.getId());
        request.put("university", "Test University");
        request.put("courseId", testCourse.getId());
        request.put("diplomaUrl", "http://example.com/diploma.pdf");

        mockMvc.perform(post("/api/applications/submit")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
