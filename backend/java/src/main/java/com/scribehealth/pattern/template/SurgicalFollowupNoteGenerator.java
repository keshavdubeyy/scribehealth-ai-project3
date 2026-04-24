package com.scribehealth.pattern.template;

/**
 * Surgical Follow-up Note Generator
 * 
 * Concrete implementation for post-operative surgical follow-up consultations.
 */
public class SurgicalFollowupNoteGenerator extends SoapNoteGenerator {
    
    @Override
    public String getTemplateName() {
        return "surgical_followup";
    }
    
    @Override
    public String[] getFields() {
        return new String[]{
            "wound_assessment", 
            "subjective", 
            "objective", 
            "assessment", 
            "plan", 
            "next_review"
        };
    }
    
    @Override
    protected String specialtyContext() {
        return "post-operative surgical follow-up";
    }
}
