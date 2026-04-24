package com.scribehealth.pattern.template;

/**
 * Mental Health Note Generator
 * 
 * Concrete implementation for mental health and psychiatry consultations.
 */
public class MentalHealthNoteGenerator extends SoapNoteGenerator {
    
    @Override
    public String getTemplateName() {
        return "mental_health_soap";
    }
    
    @Override
    public String[] getFields() {
        return new String[]{
            "subjective", 
            "objective", 
            "assessment", 
            "plan", 
            "safety_assessment"
        };
    }
    
    @Override
    protected String specialtyContext() {
        return "mental health and psychiatry";
    }
}
