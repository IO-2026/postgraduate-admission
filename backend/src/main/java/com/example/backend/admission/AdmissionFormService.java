package com.example.backend.admission;

import com.example.backend.admission.dto.AdmissionFieldDefinitionDto;
import com.example.backend.admission.dto.AdmissionFieldOptionDto;
import com.example.backend.admission.dto.AdmissionFormMetadataResponse;
import com.example.backend.admission.dto.AdmissionFormSubmissionRequest;
import com.example.backend.admission.dto.AdmissionSubmissionReceiptResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;

@Service
public class AdmissionFormService {

    public AdmissionFormMetadataResponse getFormMetadata() {
        List<AdmissionFieldDefinitionDto> fields = buildFieldDefinitions();
        return new AdmissionFormMetadataResponse(
                "Rekrutacja na studia podyplomowe",
                "Uzupelnij formularz. I wyślij swoje zgłoszenie",
                fields
        );
    }

    private static List<AdmissionFieldDefinitionDto> buildFieldDefinitions() {
        return List.of(
                fieldText(
                        "name",
                        "Imie",
                        true,
                        "np. Euzebiusz",
                        "W przyszlosci: minimum 2 znaki, tylko litery i myslnik."
                ),
                fieldText(
                        "surname",
                        "Nazwisko",
                        true,
                        "np. Kowalski",
                        "W przyszlosci: minimum 2 znaki."
                ),
                fieldText(
                        "email",
                        "Adres e-mail",
                        "email",
                        true,
                        "np. euzebiusz.kowalski@example.com",
                        "W przyszlosci: format e-mail i unikalnosc."
                ),
                fieldText(
                        "telNumber",
                        "Numer telefonu",
                        "tel",
                        true,
                        "+48 600 700 800",
                        "W przyszlosci: normalizacja i sprawdzenie formatu."
                ),
                fieldSelect(
                        "programCode",
                        "Kierunek studiow podyplomowych",
                        true,
                        "W przyszlosci: mapowanie do encji kierunku.",
                        List.of(
                                new AdmissionFieldOptionDto("IT_PM", "Zarzadzanie projektami IT"),
                                new AdmissionFieldOptionDto("AN_DATA", "Analityka danych"),
                                new AdmissionFieldOptionDto("CYBER", "Cyberbezpieczenstwo")
                        )
                ),
                fieldSelect(
                        "educationLevel",
                        "Ukonczony poziom wyksztalcenia",
                        true,
                        "W przyszlosci: walidacja zgodnosci z regulaminem rekrutacji.",
                        List.of(
                                new AdmissionFieldOptionDto("BACHELOR", "Licencjat / inzynier"),
                                new AdmissionFieldOptionDto("MASTER", "Magister"),
                                new AdmissionFieldOptionDto("DOCTORATE", "Doktor")
                        )
                ),
                fieldFile(
                        "diploma",
                        "Skan dyplomu ukończenia studiów",
                        true,
                        "W przyszlosci: walidacja zgodnosci typu pliku"
                ),
                fieldTextarea(
                        "motivation",
                        "Motywacja",
                        false,
                        "Napisz kilka zdan, dlaczego chcesz dolaczyc do programu.",
                        "W przyszlosci: limit dlugosci i wykrywanie pustej tresci."
                ),
                fieldFile(
                        "profilePicture",
                        "Zdjęcie do legityjmacji",
                        true,
                        "W przyszlosci: walidacja zgodnosci typu pliku"
                ),
                fieldCheckbox(
                        "consentAccepted",
                        "Akceptuje regulamin rekrutacji i polityke prywatnosci",
                        true,
                        "W przyszlosci: wymagane true przed zapisem do bazy."
                )
        );
    }

    private static AdmissionFieldDefinitionDto fieldText(
            String name,
            String label,
            boolean required,
            String placeholder,
            String validationHint
    ) {
        return fieldText(name, label, "text", required, placeholder, validationHint);
    }

    private static AdmissionFieldDefinitionDto fieldText(
            String name,
            String label,
            String type,
            boolean required,
            String placeholder,
            String validationHint
    ) {
        return new AdmissionFieldDefinitionDto(
                name,
                label,
                type,
                required,
                placeholder,
                validationHint,
                List.of()
        );
    }

    private static AdmissionFieldDefinitionDto fieldSelect(
            String name,
            String label,
            boolean required,
            String validationHint,
            List<AdmissionFieldOptionDto> options
    ) {
        return new AdmissionFieldDefinitionDto(
                name,
                label,
                "select",
                required,
                null,
                validationHint,
                options
        );
    }

    private static AdmissionFieldDefinitionDto fieldFile(
            String name,
            String label,
            boolean required,
            String validationHint
    ) {
        return new AdmissionFieldDefinitionDto(
                name,
                label,
                "file",
                required,
                null,
                validationHint,
                List.of()
        );
    }

    private static AdmissionFieldDefinitionDto fieldTextarea(
            String name,
            String label,
            boolean required,
            String placeholder,
            String validationHint
    ) {
        return new AdmissionFieldDefinitionDto(
                name,
                label,
                "textarea",
                required,
                placeholder,
                validationHint,
                List.of()
        );
    }

    private static AdmissionFieldDefinitionDto fieldCheckbox(
            String name,
            String label,
            boolean required,
            String validationHint
    ) {
        return new AdmissionFieldDefinitionDto(
                name,
                label,
                "checkbox",
                required,
                null,
                validationHint,
                List.of()
        );
    }

    public AdmissionSubmissionReceiptResponse submit(AdmissionFormSubmissionRequest request) {
        // Placeholder for future validation and persistence workflow.
        String submissionId = UUID.randomUUID().toString();

        return new AdmissionSubmissionReceiptResponse(
                submissionId,
                "DRAFT_RECEIVED",
                "Formularz zostal przyjety w trybie testowym."
        );
    }

    public AdmissionSubmissionReceiptResponse submit(
            AdmissionFormSubmissionRequest request,
            MultipartFile diploma,
            MultipartFile profilePicture
    ) {
        String submissionId = UUID.randomUUID().toString();

        return new AdmissionSubmissionReceiptResponse(
                submissionId,
                "DRAFT_RECEIVED",
                "Formularz zostal przyjety w trybie testowym."
        );
    }
}
