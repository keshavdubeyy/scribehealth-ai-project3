package com.scribehealth.pattern.template;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Simple implementation of AiClient using Claude API.
 * This is a Spring-managed component that can be injected.
 */
@Component
public class ClaudeAiClient implements AiClient {
    
    private final RestTemplate restTemplate;
    private final String apiKey;
    private final String model;
    
    public ClaudeAiClient() {
        this.restTemplate = new RestTemplate();
        this.apiKey = System.getenv("ANTHROPIC_API_KEY");
        this.model = "claude-sonnet-4-6";
    }
    
    @Override
    public String generateText(String prompt) {
        // For now, return a mock implementation
        // In production, this would call the Claude API
        // This is a placeholder to demonstrate the pattern
        return "{\"subjective\": \"Patient reports symptoms...\", \"objective\": \"Physical examination shows...\", \"assessment\": \"Diagnosis is...\", \"plan\": \"Treatment plan includes...\"}";
    }
}
