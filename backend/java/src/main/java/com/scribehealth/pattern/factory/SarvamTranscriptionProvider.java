package com.scribehealth.pattern.factory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Concrete provider: Sarvam AI
 * 
 * Implements the TranscriptionProvider interface for Sarvam AI's speech-to-text API.
 * Supports Hindi and English transcription.
 */
public class SarvamTranscriptionProvider implements TranscriptionProvider {
    
    private static final Logger log = LoggerFactory.getLogger(SarvamTranscriptionProvider.class);
    private static final String API_URL = "https://api.sarvam.ai/speech-to-text";
    
    private final String apiKey;
    private final RestTemplate restTemplate;
    
    public SarvamTranscriptionProvider(String apiKey) {
        this.apiKey = apiKey;
        this.restTemplate = new RestTemplate();
    }
    
    @Override
    public String getName() {
        return "sarvam";
    }
    
    @Override
    public String transcribe(byte[] audioData, String mimeType) throws TranscriptionException {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("api-subscription-key", apiKey);
            // Let RestTemplate handle multipart content-type with boundary
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new MultipartFileResource(audioData, "recording.webm", mimeType));
            body.add("model", "saarika:v2.5");
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(API_URL, requestEntity, Map.class);
            
            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new TranscriptionException(getName(), response.getStatusCode().value(), 
                    "API returned non-success status");
            }
            
            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null || !responseBody.containsKey("transcript")) {
                throw new TranscriptionException("Response missing 'transcript' field");
            }
            
            String transcript = (String) responseBody.get("transcript");
            log.info("Transcription successful using Sarvam AI, length: {} chars", transcript.length());
            return transcript;
            
        } catch (TranscriptionException e) {
            throw e;
        } catch (Exception e) {
            throw new TranscriptionException("Transcription failed: " + e.getMessage(), e);
        }
    }
    
    @Override
    public boolean isAvailable() {
        // Sarvam is available if we have an API key
        return apiKey != null && !apiKey.isEmpty();
    }
    
    /**
     * Helper class to wrap byte array as a resource for multipart upload
     */
    private static class MultipartFileResource extends org.springframework.core.io.ByteArrayResource {
        private final String filename;
        private final String contentType;
        
        public MultipartFileResource(byte[] byteArray, String filename, String contentType) {
            super(byteArray);
            this.filename = filename;
            this.contentType = contentType;
        }
        
        @Override
        public String getFilename() {
            return filename;
        }
        
        @Override
        public String getDescription() {
            return contentType;
        }
    }
}
