package com.example.backend;
import com.example.backend.model.course.AssignRequest;

import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
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

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;


import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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

        Course course = new Course();
        course.setName("TestCourse");
        course.setPrice(0.0);
        course = courseRepository.save(course);

        AssignRequest req = new AssignRequest(user.getId());

        mockMvc.perform(post("/api/admin/courses/" + course.getId() + "/coordinator")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        Optional<Course> maybe = courseRepository.findById(course.getId());
        assertTrue(maybe.isPresent());
        assertEquals(user.getId(), maybe.get().getCoordinator().getId());
    }

    @Test
    public void testCreateCourseWithPlacesLimit() throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", "Analityka danych");
        payload.put("description", "Program testowy");
        payload.put("price", 4500.0);
        payload.put("placesLimit", 40);
        payload.put("recruitmentStart", "2026-06-01");
        payload.put("recruitmentEnd", "2026-07-31");

        mockMvc.perform(post("/api/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.placesLimit").value(40));
    }

    @Test
    public void testUpdateCourseWithPlacesLimit() throws Exception {
        Course course = new Course();
        course.setName("Kierunek testowy");
        course.setDescription("Opis");
        course.setPrice(1000.0);
        course.setRecruitmentStart(LocalDate.of(2026, 5, 1));
        course.setRecruitmentEnd(LocalDate.of(2026, 8, 1));
        course.setPlacesLimit(25);
        course = courseRepository.save(course);

        Map<String, Object> payload = new HashMap<>();
        payload.put("name", "Kierunek testowy");
        payload.put("description", "Zmieniony opis");
        payload.put("price", 1200.0);
        payload.put("placesLimit", 55);
        payload.put("recruitmentStart", "2026-05-01");
        payload.put("recruitmentEnd", "2026-08-01");

        mockMvc.perform(put("/api/courses/" + course.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.placesLimit").value(55));

        Course updatedCourse = courseRepository.findById(course.getId()).orElseThrow();
        assertEquals(55, updatedCourse.getPlacesLimit());
    }
}
