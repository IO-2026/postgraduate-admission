package com.example.backend;

import com.example.backend.storage.SupabaseStorageService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.web.reactive.function.client.WebClient;
import org.mockito.Mockito;

@TestConfiguration
public class TestWebClientConfig {
    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean
    @Primary
    public SupabaseStorageService mockSupabaseStorageService() {
        SupabaseStorageService mock = Mockito.mock(SupabaseStorageService.class);
        // Mock upload diploma to succeed silently
        Mockito.doNothing().when(mock).uploadDiploma(Mockito.anyString(), Mockito.any());
        // Mock delete to succeed silently
        Mockito.doNothing().when(mock).deleteObject(Mockito.anyString(), Mockito.anyString());
        // Mock signing to return a dummy URL
        Mockito.when(mock.createSignedUrl(Mockito.anyString(), Mockito.anyString()))
                .thenReturn("http://signed-url-test.example.com/diploma.pdf");
        // Return actual values for getters
        Mockito.when(mock.getDiplomasBucket()).thenReturn("diplomas");
        Mockito.when(mock.getMaxDiplomaBytes()).thenReturn(10L * 1024 * 1024);
        return mock;
    }
}
