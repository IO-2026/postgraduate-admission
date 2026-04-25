package com.example.backend.model.application;


import com.example.backend.model.application.dto.AdmissionAddressDto;
import com.example.backend.model.application.dto.AdmissionApplicantDto;
import com.example.backend.model.application.dto.AdmissionDetailsDto;
import com.example.backend.model.application.dto.AdmissionEducationDto;
import com.example.backend.model.application.dto.AdmissionSubmitRequest;
import com.example.backend.model.application.storage.InvalidDiplomaFileException;
import com.example.backend.model.application.storage.StorageOperationException;
import com.example.backend.model.application.storage.StorageService;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private static final long MAX_DIPLOMA_FILE_SIZE_BYTES = 10L * 1024L * 1024L;

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final StorageService storageService;

    @Transactional
    public Application saveApplication(AdmissionSubmitRequest admissionRequest, MultipartFile diplomaFile) {
        validateDiplomaFile(diplomaFile);

        AdmissionApplicantDto applicant = admissionRequest.getApplicant();
        AdmissionAddressDto address = applicant.getAddress();
        AdmissionEducationDto education = admissionRequest.getEducation();
        AdmissionDetailsDto details = admissionRequest.getDetails();

        User user = userRepository.findById(admissionRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Application application = new Application();
        application.setUser(user);

        application.setUniversity(details.getUniversity());
        application.setCourseId(details.getCourseId());

        application.setApplicantName(applicant.getName());
        application.setApplicantSurname(applicant.getSurname());
        application.setApplicantTelNumber(applicant.getTelNumber());
        application.setApplicantDateOfBirth(applicant.getDateOfBirth());
        application.setApplicantPesel(applicant.getPesel());

        application.setAddressStreet(address.getStreet());
        application.setAddressPostalCode(address.getPostalCode());
        application.setAddressCity(address.getCity());

        application.setPreviousDegree(education.getPreviousDegree());
        application.setFieldOfStudy(education.getFieldOfStudy());
        application.setGraduationYear(education.getGraduationYear());

        application.setNotes(details.getNotes());
        application.setTruthfulnessConsent(details.isTruthfulnessConsent());
        application.setGdprConsent(details.isGdprConsent());

        application.setIsPaid(false);
        application.setStatus(ApplicationStatus.SUBMITTED);

        Application savedApplication = applicationRepository.saveAndFlush(application);
        String storageKey = buildDiplomaStorageKey(user.getId(), savedApplication.getId(), diplomaFile.getOriginalFilename());
        String storedKey = storeDiplomaFile(diplomaFile, storageKey);
        savedApplication.setDiplomaKey(storedKey);
        savedApplication = applicationRepository.saveAndFlush(savedApplication);

        emailService.sendApplicationStatusChange(user, savedApplication);

        return savedApplication;
    }

    @Transactional(readOnly = true)
    public String getDiplomaDownloadUrl(Long applicationId, Authentication authentication) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Wniosek nie istnieje."));

        if (!canAccessApplication(authentication, application)) {
            throw new IllegalArgumentException("Brak uprawnień do pobrania dyplomu.");
        }

        String diplomaKey = application.getDiplomaKey();
        if (diplomaKey == null || diplomaKey.isBlank()) {
            throw new IllegalArgumentException("Brak dyplomu dla tego wniosku.");
        }

        return storageService.createSignedDownloadUrl(diplomaKey, 120);
    }

    @Transactional
    public void updateStatus(Long applicationId, ApplicationStatus newStatus) {
        Application application = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Application not found"));
        User user = application.getUser();

        if (application.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw new IllegalStateException("Wniosek jest już wycofany.");
        }

        application.setStatus(newStatus);
        emailService.sendApplicationStatusChange(user, application);
    }

    private static void validateDiplomaFile(MultipartFile diplomaFile) {
        if (diplomaFile == null || diplomaFile.isEmpty()) {
            throw new InvalidDiplomaFileException("Plik dyplomu jest wymagany.");
        }

        if (diplomaFile.getSize() > MAX_DIPLOMA_FILE_SIZE_BYTES) {
            throw new InvalidDiplomaFileException("Plik dyplomu jest za duży (maks. 10MB).");
        }

        String fileName = diplomaFile.getOriginalFilename();
        if (fileName == null || !fileName.toLowerCase(Locale.ROOT).endsWith(".pdf")) {
            throw new InvalidDiplomaFileException("Dozwolony jest tylko plik PDF.");
        }

        if (!isPdfFile(diplomaFile)) {
            throw new InvalidDiplomaFileException("Przesłany plik nie jest prawidłowym PDF.");
        }
    }

    private String storeDiplomaFile(MultipartFile diplomaFile, String storageKey) {
        try {
            return storageService.uploadDiploma(diplomaFile.getBytes(), "application/pdf", storageKey);
        } catch (IOException ex) {
            throw new StorageOperationException("Nie udało się odczytać przesłanego pliku.", ex);
        }
    }

    private static String buildDiplomaStorageKey(Long userId, Long applicationId, String originalFileName) {
        return "diplomas/" + userId + "/" + applicationId + "/" + UUID.randomUUID() + ".pdf";
    }

    private static boolean isPdfFile(MultipartFile file) {
        byte[] header = new byte[5];
        try (InputStream inputStream = file.getInputStream()) {
            int bytesRead = inputStream.read(header);
            if (bytesRead < 5) {
                return false;
            }
        } catch (IOException ex) {
            return false;
        }

        return header[0] == '%' && header[1] == 'P' && header[2] == 'D' && header[3] == 'F' && header[4] == '-';
    }

    private static boolean canAccessApplication(Authentication authentication, Application application) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        boolean isOwner = username != null && username.equalsIgnoreCase(application.getUser().getEmail());
        boolean isAdmin = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority != null)
                .map(authority -> authority.toLowerCase(Locale.ROOT))
                .anyMatch(authority -> authority.equals("role_admin") || authority.equals("admin"));

        return isOwner || isAdmin;
    }
}
