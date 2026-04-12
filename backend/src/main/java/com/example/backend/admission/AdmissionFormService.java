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
        List<AdmissionFieldDefinitionDto> fields = List.of(
                new AdmissionFieldDefinitionDto(
                        "name",
                        "Imie",
                        "text",
                        true,
                        "np. Euzebiusz",
                        "W przyszlosci: minimum 2 znaki, tylko litery i myslnik.",
                        List.of()
                ),
                new AdmissionFieldDefinitionDto(
                        "surname",
                        "Nazwisko",
                        "text",
                        true,
                        "np. Kowalski",
                        "W przyszlosci: minimum 2 znaki.",
                        List.of()
                ),
                new AdmissionFieldDefinitionDto(
                        "email",
                        "Adres e-mail",
                        "email",
                        true,
                        "np. euzebiusz.kowalski@example.com",
                        "W przyszlosci: format e-mail i unikalnosc.",
                        List.of()
                ),
                new AdmissionFieldDefinitionDto(
                        "telNumber",
                        "Numer telefonu",
                        "tel",
                        true,
                        "+48 600 700 800",
                        "W przyszlosci: normalizacja i sprawdzenie formatu.",
                        List.of()
                ),
                new AdmissionFieldDefinitionDto(
                        "programCode",
                        "Kierunek studiow podyplomowych",
                        "select",
                        true,
                        null,
                        "W przyszlosci: mapowanie do encji kierunku.",

                        // w przyszłości pobranie z listy dostępnych
                        List.of(
                                new AdmissionFieldOptionDto("IT_PM", "Zarzadzanie projektami IT"),
                                new AdmissionFieldOptionDto("AN_DATA", "Analityka danych"),
                                new AdmissionFieldOptionDto("CYBER", "Cyberbezpieczenstwo")
                        )
                ),
                new AdmissionFieldDefinitionDto(
                        "educationLevel",
                        "Ukonczony poziom wyksztalcenia",
                        "select",
                        true,
                        null,
                        "W przyszlosci: walidacja zgodnosci z regulaminem rekrutacji.",
                        List.of(
                                new AdmissionFieldOptionDto("BACHELOR", "Licencjat / inzynier"),
                                new AdmissionFieldOptionDto("MASTER", "Magister"),
                                new AdmissionFieldOptionDto("DOCTORATE", "Doktor")
                        )
                ),
                new AdmissionFieldDefinitionDto(
                        "diploma",
                        "Skan dyplomu ukończenia studiów",
                        "file",
                        true,
                        null,
                        "W przyszlosci: walidacja zgodnosci typu pliku",
                        List.of()

                ),
                new AdmissionFieldDefinitionDto(
                        "motivation",
                        "Motywacja",
                        "textarea",
                        false,
                        "Napisz kilka zdan, dlaczego chcesz dolaczyc do programu.",
                        "W przyszlosci: limit dlugosci i wykrywanie pustej tresci.",
                        List.of()
                ),
                new AdmissionFieldDefinitionDto(
                        "profilePicture",
                        "Zdjęcie do legityjmacji",
                        "file",
                        true,
                        null,
                        "W przyszlosci: walidacja zgodnosci typu pliku",
                        List.of()

                ),
                new AdmissionFieldDefinitionDto(
                        "consentAccepted",
                        "Akceptuje regulamin rekrutacji i polityke prywatnosci",
                        "checkbox",
                        true,
                        null,
                        "W przyszlosci: wymagane true przed zapisem do bazy.",
                        List.of()
                )
        );

        return new AdmissionFormMetadataResponse(
                "Rekrutacja na studia podyplomowe",
                "Uzupelnij formularz. I wyślij swoje zgłoszenie",
                fields
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
