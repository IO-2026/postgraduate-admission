package com.example.backend;

import com.example.backend.model.application.ApplicationController;
import com.example.backend.model.application.ApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@ExtendWith(MockitoExtension.class)
public class ApplicationValidationTests {

    @Mock
    private ApplicationService applicationService;

    @InjectMocks
    private ApplicationController applicationController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(applicationController).build();
    }

    @Test
    void submitApplication_ShouldFail_WhenMissingTopLevelFields() throws Exception {
        String payload = "{}";

        MvcResult result = mockMvc.perform(post("/api/applications/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andReturn();

        assertEquals(400, result.getResponse().getStatus());
    }

    @Test
    void submitApplication_ShouldFail_WhenMissingApplicantFields() throws Exception {
        String payload = """
                {
                  "applicantDateOfBirth": "2000-01-01",
                  "applicantPesel": "123",
                  "addressStreet": "",
                  "addressPostalCode": "00-000",
                  "addressCity": "",
                  "previousDegree": "Inżynier",
                  "fieldOfStudy": "Informatyka",
                  "graduationYear": 2015,
                  "courseId": 1,
                  "university": "",
                  "diplomaUrl": "not-a-url",
                  "truthfulnessConsent": false,
                  "gdprConsent": false
                }
                """;

        MvcResult result = mockMvc.perform(post("/api/applications/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andReturn();

        assertEquals(400, result.getResponse().getStatus());
        assertFalse(result.getResponse().getContentAsString().contains("applicant"));
    }

    @Test
    void submitApplication_ShouldFail_WhenEducationFieldsAreMissing() throws Exception {
        String payload = """
                {
                  "applicantDateOfBirth": "2000-01-01",
                  "applicantPesel": "44051401458",
                  "addressStreet": "Testowa 1",
                  "addressPostalCode": "30-059",
                  "addressCity": "Kraków",
                  "previousDegree": "",
                  "fieldOfStudy": "",
                  "graduationYear": null,
                  "courseId": 1,
                  "university": "AGH",
                  "diplomaUrl": "https://example.com/diploma.pdf",
                  "truthfulnessConsent": true,
                  "gdprConsent": true
                }
                """;

        MvcResult result = mockMvc.perform(post("/api/applications/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andReturn();

        assertEquals(400, result.getResponse().getStatus());
        assertFalse(result.getResponse().getContentAsString().contains("previousDegree"));
    }
}