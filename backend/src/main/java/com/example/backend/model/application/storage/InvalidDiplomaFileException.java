package com.example.backend.model.application.storage;

public class InvalidDiplomaFileException extends RuntimeException {
    public InvalidDiplomaFileException(String message) {
        super(message);
    }
}
