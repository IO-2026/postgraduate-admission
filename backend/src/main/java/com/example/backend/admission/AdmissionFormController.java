package com.example.backend.admission;

import com.example.backend.admission.dto.AdmissionFormMetadataResponse;
import com.example.backend.admission.dto.AdmissionFormSubmissionRequest;
import com.example.backend.admission.dto.AdmissionSubmissionReceiptResponse;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admission/form")
public class AdmissionFormController {

    private final AdmissionFormService admissionFormService;

    public AdmissionFormController(AdmissionFormService admissionFormService) {
        this.admissionFormService = admissionFormService;
    }

    @GetMapping
    public ResponseEntity<AdmissionFormMetadataResponse> getFormMetadata() {
        return ResponseEntity.ok(admissionFormService.getFormMetadata());
    }

    @PostMapping("/submit")
    public ResponseEntity<AdmissionSubmissionReceiptResponse> submit(
            @RequestBody AdmissionFormSubmissionRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(admissionFormService.submit(request));
    }

        @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<AdmissionSubmissionReceiptResponse> submitMultipart(
            @RequestPart("data") AdmissionFormSubmissionRequest request,
                @RequestPart(value = "diploma", required = false) MultipartFile diploma,
                @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture
        ) {
            if (diploma == null || diploma.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(new AdmissionSubmissionReceiptResponse(
                                null,
                                "VALIDATION_FAILED",
                                "Brak wymaganego zalacznika: dyplom (PDF)."
                        ));
            }

            if (profilePicture == null || profilePicture.isEmpty()) {
                return ResponseEntity
                        .badRequest()
                        .body(new AdmissionSubmissionReceiptResponse(
                                null,
                                "VALIDATION_FAILED",
                                "Brak wymaganego zalacznika: zdjecie (PNG)."
                        ));
            }

            if (!isPdf(diploma)) {
                return ResponseEntity
                        .badRequest()
                        .body(new AdmissionSubmissionReceiptResponse(
                                null,
                                "VALIDATION_FAILED",
                                "Niepoprawny format dyplomu. Wymagany plik PDF."
                        ));
            }

            if (!isPng(profilePicture)) {
                return ResponseEntity
                        .badRequest()
                        .body(new AdmissionSubmissionReceiptResponse(
                                null,
                                "VALIDATION_FAILED",
                                "Niepoprawny format zdjecia. Wymagany plik PNG."
                        ));
            }

        return ResponseEntity
            .status(HttpStatus.ACCEPTED)
            .body(admissionFormService.submit(request, diploma, profilePicture));
        }

        private static boolean isPdf(MultipartFile file) {
            String contentType = file.getContentType();
            if (contentType != null && contentType.equalsIgnoreCase("application/pdf")) {
                return true;
            }

            String filename = file.getOriginalFilename();
            return filename != null && filename.toLowerCase().endsWith(".pdf");
        }

        private static boolean isPng(MultipartFile file) {
            String contentType = file.getContentType();
            if (contentType != null && contentType.equalsIgnoreCase("image/png")) {
                return true;
            }

            String filename = file.getOriginalFilename();
            return filename != null && filename.toLowerCase().endsWith(".png");
        }
}
