package com.scribehealth.pattern.template;

/**
 * Cardiology Note Generator
 * 
 * Concrete implementation for cardiology consultations.
 */
public class CardiologyNoteGenerator extends SoapNoteGenerator {
    
    @Override
    public String getTemplateName() {
        return "cardiology";
    }
    
    @Override
    public String[] getFields() {
        return new String[]{
            "subjective", 
            "objective", 
            "assessment", 
            "plan", 
            "medications", 
            "follow_up"
        };
    }
    
    @Override
    protected String specialtyContext() {
        return "cardiology and cardiovascular medicine";
    }
}
