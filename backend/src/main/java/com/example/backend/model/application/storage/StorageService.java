package com.example.backend.model.application.storage;

public interface StorageService {
    String uploadDiploma(byte[] fileBytes, String contentType, String storageKey);

    String createSignedDownloadUrl(String storageKey, int expiresInSeconds);

    void delete(String storageKey);
}
