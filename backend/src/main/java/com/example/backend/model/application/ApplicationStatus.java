package com.example.backend.model.application;

import lombok.Getter;

@Getter
public enum ApplicationStatus {
    SUBMITTED("Wniosek przyjęty"),
    VERIFIED("Wniosek zweryfikowany"),
    WAITING_LIST("Wniosek na liście rezerwowej"),
    ACCEPTED("Wniosek zaakceptowany"),
    REJECTED("Wniosek odrzucony"),
    WITHDRAWN("Wniosek wycofany");

    private final String description;

    ApplicationStatus(String description) {
        this.description = description;
    }

}
