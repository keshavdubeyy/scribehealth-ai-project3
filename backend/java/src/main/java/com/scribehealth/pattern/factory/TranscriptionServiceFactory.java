package com.scribehealth.pattern.factory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Factory Method Pattern for creating TranscriptionProvider instances.
 * 
 * This factory creates the appropriate transcription provider based on configuration.
 * New providers can be added by:
 * 1. Creating a new class implementing TranscriptionProvider
 * 2. Adding a new case in the create() method
 * 
 * No other code needs to change - this demonstrates the Open/Closed Principle.
 */
@Component
public class TranscriptionServiceFactory {
    
    private final String defaultProvider;
    private final String sarvamApiKey;
    
    public TranscriptionServiceFactory(
            @Value("${transcription.provider:sarvam}") String defaultProvider,
            @Value("${sarvam.api.key:}") String sarvamApiKey) {
        this.defaultProvider = defaultProvider;
        this.sarvamApiKey = sarvamApiKey;
    }
    
    /**
     * Creates a transcription provider with the configured default provider.
     * @return a TranscriptionProvider instance
     * @throws IllegalStateException if the provider cannot be created
     */
    public TranscriptionProvider create() {
        return create(defaultProvider);
    }
    
    /**
     * Creates a transcription provider by name.
     * 
     * @param providerName the name of the provider to create
     * @return a TranscriptionProvider instance
     * @throws IllegalArgumentException if the provider is unknown
     * @throws IllegalStateException if required configuration is missing
     */
    public TranscriptionProvider create(String providerName) {
        switch (providerName.toLowerCase()) {
            case "sarvam":
                if (sarvamApiKey == null || sarvamApiKey.isBlank()) {
                    throw new IllegalStateException("SARVAM_API_KEY not configured");
                }
                return new SarvamTranscriptionProvider(sarvamApiKey);
                
            // Future providers can be added here without changing existing code:
            // case "whisper":
            //     return new WhisperTranscriptionProvider(openAiApiKey);
            // case "google":
            //     return new GoogleTranscriptionProvider(googleCredentials);
            
            default:
                throw new IllegalArgumentException("Unknown transcription provider: \"" + providerName + "\"");
        }
    }
    
    /**
     * Returns a list of all available provider names.
     * @return array of provider names
     */
    public String[] getAvailableProviders() {
        return new String[]{"sarvam"}; // Extend as new providers are added
    }
}
