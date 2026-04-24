package com.scribehealth.pattern.template;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Factory for creating and retrieving SOAP note generators.
 * 
 * This factory maintains a registry of all available note generators
 * and provides methods to retrieve them by template name.
 */
@Component
public class NoteGeneratorFactory {
    
    private final Map<String, SoapNoteGenerator> generators = new ConcurrentHashMap<>();
    
    public NoteGeneratorFactory() {
        // Register all available generators
        register(new GeneralOpdNoteGenerator());
        register(new MentalHealthNoteGenerator());
        register(new PhysiotherapyNoteGenerator());
        register(new PediatricNoteGenerator());
        register(new CardiologyNoteGenerator());
        register(new SurgicalFollowupNoteGenerator());
    }
    
    private void register(SoapNoteGenerator generator) {
        generators.put(generator.getTemplateName(), generator);
    }
    
    /**
     * Returns the generator for the given template name.
     * Defaults to General OPD if template not found.
     * 
     * @param templateName the template name
     * @return the appropriate SoapNoteGenerator
     */
    public SoapNoteGenerator get(String templateName) {
        return generators.getOrDefault(templateName, new GeneralOpdNoteGenerator());
    }
    
    /**
     * Returns all registered template names.
     * Used for template detection prompts.
     * 
     * @return list of all template names
     */
    public List<String> getTemplateNames() {
        return List.copyOf(generators.keySet());
    }
    
    /**
     * Returns the count of registered generators.
     * @return number of templates
     */
    public int getTemplateCount() {
        return generators.size();
    }
}
