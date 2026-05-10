package com.example.backend;

import com.example.backend.model.application.ApplicationController;
import com.example.backend.model.application.ApplicationService;
import com.example.backend.model.declaration.DeclarationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;

@ExtendWith(MockitoExtension.class)
public class ApplicationValidationTests {

    @Mock
    private ApplicationService applicationService;

    @Mock
    private DeclarationService declarationService;

    @InjectMocks
    private ApplicationController applicationController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(applicationController).build();
    }

    @Test
        void submitApplication_ShouldFail_WhenMissingApplicationPart() throws Exception {
        MockMultipartFile diplomaPart = new MockMultipartFile(
            "diploma",
            "diploma.pdf",
            MediaType.APPLICATION_PDF_VALUE,
            "fake-pdf".getBytes()
        );

        MvcResult result = mockMvc.perform(multipart("/api/applications/submit")
                .file(diplomaPart))
                .andReturn();

        assertEquals(400, result.getResponse().getStatus());
    }

    @Test
        void submitApplication_ShouldFail_WhenMissingDiplomaPart() throws Exception {
        MockMultipartFile applicationPart = new MockMultipartFile(
            "application",
            "application.json",
            MediaType.APPLICATION_JSON_VALUE,
            "{}".getBytes()
        );

        MvcResult result = mockMvc.perform(multipart("/api/applications/submit")
                .file(applicationPart))
            .andReturn();

        assertEquals(400, result.getResponse().getStatus());
    }
}