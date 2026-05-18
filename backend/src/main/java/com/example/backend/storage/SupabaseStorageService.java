package com.example.backend.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriBuilder;

import java.net.URI;
import java.util.Map;

@Service
public class SupabaseStorageService {
    private final WebClient webClient;
    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final String diplomasBucket;
    private final long maxDiplomaBytes;
    private final int signedUrlTtlSeconds;

    public SupabaseStorageService(WebClient.Builder webClientBuilder,
                                  @Value("${supabase.url}") String supabaseUrl,
                                  @Value("${supabase.service-role-key}") String serviceRoleKey,
                                  @Value("${supabase.storage.diplomas-bucket}") String diplomasBucket,
                                  @Value("${supabase.storage.diploma-max-bytes}") long maxDiplomaBytes,
                                  @Value("${supabase.storage.signed-url-ttl-seconds}") int signedUrlTtlSeconds) {
        this.supabaseUrl = normalizeBaseUrl(supabaseUrl);
        this.serviceRoleKey = serviceRoleKey;
        this.diplomasBucket = diplomasBucket;
        this.maxDiplomaBytes = maxDiplomaBytes;
        this.signedUrlTtlSeconds = signedUrlTtlSeconds;
        this.webClient = webClientBuilder.baseUrl(this.supabaseUrl).build();
    }

    public String getDiplomasBucket() {
        return diplomasBucket;
    }

    public long getMaxDiplomaBytes() {
        return maxDiplomaBytes;
    }

    public void uploadDiploma(String objectKey, Resource content) {
        try {
            webClient.post()
                    .uri(uriBuilder -> buildObjectUri(uriBuilder, diplomasBucket, objectKey))
                    .header("x-upsert", "true")
                    .contentType(MediaType.APPLICATION_PDF)
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .body(BodyInserters.fromResource(content))
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (WebClientResponseException ex) {
            throw new IllegalStateException("Nie udało się przesłać dyplomu: " + ex.getStatusCode(), ex);
        }
    }

    public void deleteObject(String bucket, String objectKey) {
        try {
            webClient.delete()
                    .uri(uriBuilder -> buildObjectUri(uriBuilder, bucket, objectKey))
                    .header("Authorization", "Bearer " + serviceRoleKey)
                    .header("apikey", serviceRoleKey)
                    .retrieve()
                    .toBodilessEntity()
                    .block();
        } catch (WebClientResponseException ex) {
            throw new IllegalStateException("Nie udało się usunąć dyplomu: " + ex.getStatusCode(), ex);
        }
    }

    public String createSignedUrl(String bucket, String objectKey) {
        ResponseEntity<SignedUrlResponse> response = webClient.post()
                .uri("/storage/v1/object/sign/{bucket}/{objectKey}", bucket, objectKey)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey)
                .bodyValue(Map.of("expiresIn", signedUrlTtlSeconds))
                .retrieve()
                .toEntity(SignedUrlResponse.class)
                .block();

        SignedUrlResponse body = response != null ? response.getBody() : null;
        if (body == null || !StringUtils.hasText(body.signedURL())) {
            throw new IllegalStateException("Supabase nie zwrócił podpisanego adresu URL");
        }

        String signedUrl = body.signedURL();
        if (signedUrl.startsWith("http")) {
            return signedUrl;
        }
        return supabaseUrl + signedUrl;
    }

    private URI buildObjectUri(UriBuilder builder, String bucket, String objectKey) {
        return builder.path("/storage/v1/object/{bucket}/{objectKey}")
                .build(bucket, objectKey);
    }

    private String normalizeBaseUrl(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException("Wymagany jest adres URL Supabase");
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private record SignedUrlResponse(String signedURL) {
    }
}
