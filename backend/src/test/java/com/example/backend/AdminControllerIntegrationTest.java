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
import org.springframework.context.annotation.Import;
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
@Import({TestDynamicProperties.class, TestWebClientConfig.class})
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
}
