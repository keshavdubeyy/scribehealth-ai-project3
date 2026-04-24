package com.scribehealth.pattern.template;

/**
 * Physiotherapy Note Generator
 * 
 * Concrete implementation for physiotherapy and rehabilitation consultations.
 */
public class PhysiotherapyNoteGenerator extends SoapNoteGenerator {
    
    @Override
    public String getTemplateName() {
        return "physiotherapy";
    }
    
    @Override
    public String[] getFields() {
        return new String[]{
            "subjective", 
            "objective", 
            "assessment", 
            "treatment", 
            "home_exercise_program", 
            "plan"
        };
    }
    
    @Override
    protected String specialtyContext() {
        return "physiotherapy and rehabilitation";
    }
}
