package com.scribehealth.pattern.template;

/**
 * Pediatric Note Generator
 * 
 * Concrete implementation for pediatric consultations.
 */
public class PediatricNoteGenerator extends SoapNoteGenerator {
    
    @Override
    public String getTemplateName() {
        return "pediatric";
    }
    
    @Override
    public String[] getFields() {
        return new String[]{
            "subjective", 
            "objective", 
            "assessment", 
            "plan", 
            "parent_instructions", 
            "follow_up"
        };
    }
    
    @Override
    protected String specialtyContext() {
        return "paediatrics";
    }
}
