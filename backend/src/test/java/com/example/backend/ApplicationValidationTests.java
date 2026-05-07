package com.example.backend;

import com.example.backend.model.application.ApplicationController;
import com.example.backend.model.application.ApplicationService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class ApplicationValidationTests {

  private MockMvc buildMockMvc() {
    ApplicationService applicationService = new ApplicationService(null, null, null, null);
    ApplicationController controller = new ApplicationController(applicationService);

    LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
    validator.afterPropertiesSet();

    return MockMvcBuilders.standaloneSetup(controller)
        .setControllerAdvice(new BackendExceptionHandler())
        .setValidator(validator)
        .build();
  }

    @Test
    void submitApplication_ShouldFail_WhenMissingTopLevelFields() throws Exception {
      buildMockMvc().perform(post("/api/applications/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("wymag")));
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

        buildMockMvc().perform(post("/api/applications/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("applicant")));
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

        buildMockMvc().perform(post("/api/applications/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("previousDegree")));
    }
}
