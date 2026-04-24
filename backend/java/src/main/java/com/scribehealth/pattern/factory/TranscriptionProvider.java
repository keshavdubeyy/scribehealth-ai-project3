package com.scribehealth.pattern.factory;

/**
 * Factory Method pattern for transcription providers (NFR-03 extensibility).
 *
 * TranscriptionProvider is the Product interface.
 * SarvamTranscriptionProvider is the concrete product.
 * TranscriptionServiceFactory is the Creator — new providers (Whisper, Google STT, etc.)
 * require only a new implementing class and a new case in the factory; no other code changes.
 *
 * The active provider is selected via the transcription.provider property (default: "sarvam").
 */
public interface TranscriptionProvider {
    
    /**
     * Returns the name of this transcription provider.
     * @return provider name (e.g., "sarvam", "whisper", etc.)
     */
    String getName();
    
    /**
     * Transcribes audio content to text.
     * 
     * @param audioData the audio data as byte array
     * @param mimeType the MIME type of the audio (e.g., "audio/webm", "audio/wav")
     * @return the transcribed text
     * @throws TranscriptionException if transcription fails
     */
    String transcribe(byte[] audioData, String mimeType) throws TranscriptionException;
    
    /**
     * Checks if this provider is available/healthy.
     * @return true if the provider is operational
     */
    boolean isAvailable();
}
