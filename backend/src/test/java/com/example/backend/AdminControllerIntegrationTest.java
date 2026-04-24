package com.example.backend;
import com.example.backend.dto.AssignRequest;

import com.example.backend.model.Course;
import com.example.backend.model.Cohort;
import com.example.backend.model.CourseRepository;
import com.example.backend.model.CohortRepository;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.Optional;


import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class AdminControllerIntegrationTest {

    @Autowired
    private WebApplicationContext wac;

    private MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    CourseRepository courseRepository;

    @Autowired
    CohortRepository cohortRepository;

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

    @BeforeEach
    public void setupMockMvc() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(wac).build();
    }

    @Test
    public void testAssignCoordinatorFlow() throws Exception {
        if (roleRepository.findAll().isEmpty()) {
            roleRepository.save(new Role(1, "ADMIN"));
            roleRepository.save(new Role(2, "COORDINATOR"));
        }

        Role coordRole = roleRepository.findAll().stream().filter(r -> r.getName().equalsIgnoreCase("COORDINATOR")).findFirst().orElseThrow();

        User user = new User();
        user.setName("Test");
        user.setSurname("Coordinator");
        user.setEmail("coord@example.com");
        user.setPassword("pass");
        user.setTelNumber("123456789");
        user.setRole(coordRole);
        user = userRepository.save(user);

        Course course = courseRepository.save(new Course(null, "TestCourse"));
        Cohort cohort = cohortRepository.save(new Cohort(null, "TestCohort", course));

        AssignRequest req = new AssignRequest(user.getId(), course.getId(), cohort.getId());

        mockMvc.perform(post("/api/admin/assign-coordinator")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        Optional<Cohort> maybe = cohortRepository.findById(cohort.getId());
        assertTrue(maybe.isPresent());
        assertEquals(user.getId(), maybe.get().getCoordinator().getId());
    }
}
