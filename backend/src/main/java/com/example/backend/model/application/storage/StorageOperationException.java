package com.example.backend.model.application.storage;

public class StorageOperationException extends RuntimeException {
    public StorageOperationException(String message) {
        super(message);
    }

    public StorageOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
