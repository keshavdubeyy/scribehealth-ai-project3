package com.scribehealth.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "transcriptions")
public class Transcription {
    @Id
    private String id;
    private String sessionId;
    private String rawText;
    private String processedText;

    @CreatedDate
    private LocalDateTime createdAt;

    public Transcription() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getRawText() { return rawText; }
    public void setRawText(String rawText) { this.rawText = rawText; }
    public String getProcessedText() { return processedText; }
    public void setProcessedText(String processedText) { this.processedText = processedText; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
