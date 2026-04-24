package com.scribehealth.pattern.template;

import java.util.Map;

/**
 * General OPD Note Generator
 * 
 * Concrete implementation of SoapNoteGenerator for general outpatient department notes.
 */
public class GeneralOpdNoteGenerator extends SoapNoteGenerator {
    
    @Override
    public String getTemplateName() {
        return "general_opd";
    }
    
    @Override
    public String[] getFields() {
        return new String[]{
            "subjective", 
            "objective", 
            "assessment", 
            "diagnosis", 
            "prescription", 
            "advice", 
            "follow_up"
        };
    }
}
