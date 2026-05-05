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
    void submitApplication_ShouldFail_WhenMissingNestedApplicantFields() throws Exception {
        String payload = """
                {
                  "applicant": {
                    "dateOfBirth": "2000-01-01",
                    "pesel": "123",
                    "address": {
                      "street": "",
                      "postalCode": "00-000",
                      "city": ""
                    }
                  },
                  "education": {
                    "previousDegree": "Inżynier",
                    "fieldOfStudy": "Informatyka",
                    "graduationYear": 2015
                  },
                  "details": {
                    "courseId": 1,
                    "university": "",
                    "diplomaUrl": "not-a-url",
                    "notes": null,
                    "truthfulnessConsent": false,
                    "gdprConsent": false
                  }
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
                  "applicant": {
                    "dateOfBirth": "2000-01-01",
                    "pesel": "44051401458",
                    "address": {
                      "street": "Testowa 1",
                      "postalCode": "30-059",
                      "city": "Kraków"
                    }
                  },
                  "education": {
                    "previousDegree": "",
                    "fieldOfStudy": "",
                    "graduationYear": null
                  },
                  "details": {
                    "courseId": 1,
                    "university": "AGH",
                    "diplomaUrl": "https://example.com/diploma.pdf",
                    "notes": null,
                    "truthfulnessConsent": true,
                    "gdprConsent": true
                  }
                }
                """;

        buildMockMvc().perform(post("/api/applications/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("education")));
    }
}
