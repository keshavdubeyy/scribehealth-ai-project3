package com.scribehealth.pattern.template;

import java.util.HashMap;
import java.util.Map;

/**
 * Template Method pattern for clinical SOAP note generation (NFR-03 extensibility).
 *
 * SoapNoteGenerator is the abstract class that defines the fixed algorithm:
 *   1. Build a specialty-aware prompt  (invariant — done by base class)
 *   2. Call AI Model                  (invariant — done by base class)
 *   3. Parse and normalize fields     (invariant — done by base class)
 *
 * Subclasses override only `templateName`, `fields`, and the optional
 * `specialtyContext()` hook. Adding a new specialty requires only a new
 * subclass and one line in NoteGeneratorFactory — the API route is untouched.
 */
public abstract class SoapNoteGenerator {
    
    /**
     * Returns the template name for this generator.
     * @return template identifier (e.g., "general_opd", "cardiology")
     */
    public abstract String getTemplateName();
    
    /**
     * Returns the list of field names for this template.
     * @return array of field names that will be present in the generated note
     */
    public abstract String[] getFields();
    
    /**
     * Template method — fixed skeleton; subclasses customize via overrides.
     * Returns a map with every field key present (empty string if not found).
     *
     * @param transcript the consultation transcript to generate from
     * @param aiClient the AI client for calling the model
     * @return map of field names to generated content
     */
    public final Map<String, String> generate(String transcript, AiClient aiClient) {
        String raw = callModel(transcript, aiClient);
        return normalizeFields(raw);
    }
    
    /**
     * Hook — subclasses may override to inject specialty context into the prompt.
     * @return specialty context string (e.g., "cardiology and cardiovascular medicine")
     */
    protected String specialtyContext() {
        return "";
    }
    
    /**
     * Calls the AI model to generate the note content.
     * This is a private method that implements the invariant algorithm step.
     */
    private String callModel(String transcript, AiClient aiClient) {
        String ctx = specialtyContext();
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are a medical scribe");
        if (!ctx.isEmpty()) {
            prompt.append(" specialising in ").append(ctx);
        }
        prompt.append(".\n\n");
        prompt.append("Generate a structured clinical note from this consultation transcript.\n\n");
        prompt.append("TRANSCRIPT:\n");
        prompt.append(transcript);
        prompt.append("\n\n");
        prompt.append("Return a JSON object with EXACTLY these keys: ");
        prompt.append(String.join(", ", getFields()));
        prompt.append("\nFill each key with concise, clinical prose from the transcript.\n");
        prompt.append("Leave a key as \"\" if the content is not mentioned.\n");
        prompt.append("Respond with JSON only — no markdown, no explanation.");
        
        return aiClient.generateText(prompt.toString());
    }
    
    /**
     * Normalizes the fields to ensure all expected fields are present.
     * This is a private method that implements the invariant algorithm step.
     */
    private Map<String, String> normalizeFields(String raw) {
        Map<String, String> result = new HashMap<>();
        Map<String, String> parsed = extractJson(raw);
        
        for (String field : getFields()) {
            result.put(field, parsed.getOrDefault(field, ""));
        }
        
        return result;
    }
    
    /**
     * Extracts JSON from a text string.
     * Looks for the first JSON object in the text.
     */
    private Map<String, String> extractJson(String text) {
        if (text == null || text.isEmpty()) {
            return new HashMap<>();
        }
        
        // Find the first { and last }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        
        if (start == -1 || end == -1 || start >= end) {
            return new HashMap<>();
        }
        
        String json = text.substring(start, end + 1);
        
        // Simple JSON parsing for flat objects with string values
        Map<String, String> result = new HashMap<>();
        
        // Remove outer braces and split by commas (naive approach for simple JSON)
        String content = json.substring(1, json.length() - 1).trim();
        if (content.isEmpty()) {
            return result;
        }
        
        // Split by comma, but be careful about commas inside quotes
        String[] pairs = content.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
        
        for (String pair : pairs) {
            String[] kv = pair.split(":", 2);
            if (kv.length == 2) {
                String key = kv[0].trim().replaceAll("^\"|\"$", "");
                String value = kv[1].trim().replaceAll("^\"|\"$", "");
                result.put(key, value);
            }
        }
        
        return result;
    }
}
