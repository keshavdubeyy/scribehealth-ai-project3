package com.scribehealth.pattern.template;

/**
 * AI Client interface for generating text from prompts.
 * This is a simplified interface that abstracts the AI model interaction.
 */
public interface AiClient {
    
    /**
     * Generates text from a given prompt using the AI model.
     * 
     * @param prompt the prompt to send to the AI
     * @return the generated text response
     */
    String generateText(String prompt);
}
