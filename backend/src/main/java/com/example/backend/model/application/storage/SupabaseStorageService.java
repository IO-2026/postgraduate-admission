package com.example.backend.model.application.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class SupabaseStorageService implements StorageService {

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final String bucket;

    public SupabaseStorageService(@Value("${supabase.url:}") String supabaseUrl,
                                  @Value("${supabase.service-role-key:}") String serviceRoleKey,
                                  @Value("${supabase.storage.bucket:diplomas}") String bucket) {
        this.supabaseUrl = trimTrailingSlash(supabaseUrl);
        this.serviceRoleKey = serviceRoleKey;
        this.bucket = bucket;
        this.restClient = RestClient.builder()
                .baseUrl(this.supabaseUrl)
                .defaultHeader("Authorization", "Bearer " + serviceRoleKey)
                .defaultHeader("apikey", serviceRoleKey)
                .build();
    }

    @Override
    public String uploadDiploma(byte[] fileBytes, String contentType, String storageKey) {
        ensureConfigured();

        String encodedKey = encodeObjectKey(storageKey);
        try {
            restClient.post()
                    .uri("/storage/v1/object/" + bucket + "/" + encodedKey)
                    .contentType(MediaType.parseMediaType(contentType))
                    .header("x-upsert", "true")
                    .body(fileBytes)
                    .retrieve()
                    .toBodilessEntity();
            return storageKey;
        } catch (RestClientResponseException ex) {
            throw new StorageOperationException(
                    "Supabase Storage upload error (HTTP " + ex.getStatusCode().value() + "). Sprawdź SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY i bucket.",
                    ex
            );
        } catch (Exception ex) {
            throw new StorageOperationException("Nie udało się zapisać pliku w Supabase Storage.", ex);
        }
    }

    @Override
    public String createSignedDownloadUrl(String storageKey, int expiresInSeconds) {
        ensureConfigured();

        String encodedKey = encodeObjectKey(storageKey);
        Map<String, Object> body = Map.of("expiresIn", expiresInSeconds);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("/storage/v1/object/sign/" + bucket + "/" + encodedKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null) {
                throw new StorageOperationException("Brak odpowiedzi z Supabase podczas generowania linku.");
            }

            Object signedUrlValue = response.containsKey("signedURL")
                    ? response.get("signedURL")
                    : response.get("signedUrl");

            if (!(signedUrlValue instanceof String signedPath) || signedPath.isBlank()) {
                throw new StorageOperationException("Supabase nie zwrócił poprawnego podpisanego URL.");
            }

            if (signedPath.startsWith("http://") || signedPath.startsWith("https://")) {
                return signedPath;
            }

            return supabaseUrl + signedPath;
        } catch (RestClientResponseException ex) {
            throw new StorageOperationException(
                    "Supabase signed URL error (HTTP " + ex.getStatusCode().value() + ").",
                    ex
            );
        } catch (StorageOperationException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new StorageOperationException("Nie udało się wygenerować linku do pobrania dyplomu.", ex);
        }
    }

    @Override
    public void delete(String storageKey) {
        ensureConfigured();

        String encodedKey = encodeObjectKey(storageKey);
        try {
            restClient.delete()
                    .uri("/storage/v1/object/" + bucket + "/" + encodedKey)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            throw new StorageOperationException("Nie udało się usunąć pliku z Supabase Storage.", ex);
        }
    }

    private void ensureConfigured() {
        if (supabaseUrl.isBlank() || serviceRoleKey.isBlank()) {
            throw new StorageOperationException("Brak konfiguracji Supabase Storage. Ustaw SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY.");
        }

        if (bucket == null || bucket.isBlank()) {
            throw new StorageOperationException("Brak konfiguracji bucketu Supabase Storage (SUPABASE_STORAGE_BUCKET).");
        }
    }

    private static String trimTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private static String encodeObjectKey(String storageKey) {
        String[] segments = storageKey.split("/");
        StringBuilder encoded = new StringBuilder();

        for (int i = 0; i < segments.length; i++) {
            if (i > 0) {
                encoded.append('/');
            }
            encoded.append(UriUtils.encodePathSegment(segments[i], StandardCharsets.UTF_8));
        }

        return encoded.toString();
    }
}
