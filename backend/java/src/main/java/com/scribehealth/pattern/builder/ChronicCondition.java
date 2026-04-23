package com.scribehealth.pattern.builder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Represents a chronic condition with ICD code validation.
 * Immutable value object.
 */
public class ChronicCondition {
    
    private final String name;
    private final String icd10Code;
    private final String diagnosisDate;
    private final String severity; // mild, moderate, severe
    private final String notes;
    
    private ChronicCondition(Builder builder) {
        this.name = builder.name;
        this.icd10Code = builder.icd10Code;
        this.diagnosisDate = builder.diagnosisDate;
        this.severity = builder.severity;
        this.notes = builder.notes;
    }
    
    public String getName() {
        return name;
    }
    
    public String getIcd10Code() {
        return icd10Code;
    }
    
    public String getDiagnosisDate() {
        return diagnosisDate;
    }
    
    public String getSeverity() {
        return severity;
    }
    
    public String getNotes() {
        return notes;
    }
    
    /**
     * Validates if the ICD-10 code follows the standard format.
     * @return true if the code is valid
     */
    public boolean isValidIcd10Code() {
        if (icd10Code == null || icd10Code.isEmpty()) {
            return false;
        }
        // ICD-10 codes: Letter + 2 digits, optionally . + digit(s)
        return icd10Code.matches("^[A-Z][0-9]{2}(\\.[0-9]+)?$");
    }
    
    @Override
    public String toString() {
        return String.format("ChronicCondition{name='%s', icd10Code='%s', severity='%s'}", 
                name, icd10Code, severity);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String name;
        private String icd10Code;
        private String diagnosisDate;
        private String severity = "moderate";
        private String notes;
        
        public Builder name(String name) {
            this.name = name;
            return this;
        }
        
        public Builder icd10Code(String icd10Code) {
            this.icd10Code = icd10Code;
            return this;
        }
        
        public Builder diagnosisDate(String diagnosisDate) {
            this.diagnosisDate = diagnosisDate;
            return this;
        }
        
        public Builder severity(String severity) {
            this.severity = severity;
            return this;
        }
        
        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }
        
        public ChronicCondition build() {
            if (name == null || name.isBlank()) {
                throw new IllegalStateException("Chronic condition name is required");
            }
            return new ChronicCondition(this);
        }
    }
}
