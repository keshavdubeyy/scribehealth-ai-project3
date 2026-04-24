package com.scribehealth.pattern.factory;

/**
 * Exception thrown when transcription fails.
 */
public class TranscriptionException extends Exception {
    
    private final String providerName;
    private final int statusCode;
    
    public TranscriptionException(String message) {
        super(message);
        this.providerName = "unknown";
        this.statusCode = -1;
    }
    
    public TranscriptionException(String message, Throwable cause) {
        super(message, cause);
        this.providerName = "unknown";
        this.statusCode = -1;
    }
    
    public TranscriptionException(String providerName, int statusCode, String message) {
        super(String.format("Transcription failed for provider '%s' (HTTP %d): %s", providerName, statusCode, message));
        this.providerName = providerName;
        this.statusCode = statusCode;
    }
    
    public String getProviderName() {
        return providerName;
    }
    
    public int getStatusCode() {
        return statusCode;
    }
}
