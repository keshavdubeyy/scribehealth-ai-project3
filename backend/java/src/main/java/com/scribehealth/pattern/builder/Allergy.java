package com.scribehealth.pattern.builder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Represents an allergy with severity metadata.
 * Immutable value object.
 */
public class Allergy {
    
    public enum Severity {
        MILD, MODERATE, SEVERE, LIFE_THREATENING
    }
    
    private final String allergen;
    private final Severity severity;
    private final String reaction;
    private final String onsetDate;
    private final String notes;
    
    private Allergy(Builder builder) {
        this.allergen = builder.allergen;
        this.severity = builder.severity;
        this.reaction = builder.reaction;
        this.onsetDate = builder.onsetDate;
        this.notes = builder.notes;
    }
    
    public String getAllergen() {
        return allergen;
    }
    
    public Severity getSeverity() {
        return severity;
    }
    
    public String getReaction() {
        return reaction;
    }
    
    public String getOnsetDate() {
        return onsetDate;
    }
    
    public String getNotes() {
        return notes;
    }
    
    /**
     * Checks if this allergy is severe or life-threatening.
     * @return true if severity is SEVERE or LIFE_THREATENING
     */
    public boolean isSevere() {
        return severity == Severity.SEVERE || severity == Severity.LIFE_THREATENING;
    }
    
    @Override
    public String toString() {
        return String.format("Allergy{allergen='%s', severity='%s', reaction='%s'}", 
                allergen, severity, reaction);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String allergen;
        private Severity severity = Severity.MODERATE;
        private String reaction;
        private String onsetDate;
        private String notes;
        
        public Builder allergen(String allergen) {
            this.allergen = allergen;
            return this;
        }
        
        public Builder severity(Severity severity) {
            this.severity = severity;
            return this;
        }
        
        public Builder reaction(String reaction) {
            this.reaction = reaction;
            return this;
        }
        
        public Builder onsetDate(String onsetDate) {
            this.onsetDate = onsetDate;
            return this;
        }
        
        public Builder notes(String notes) {
            this.notes = notes;
            return this;
        }
        
        public Allergy build() {
            if (allergen == null || allergen.isBlank()) {
                throw new IllegalStateException("Allergen name is required");
            }
            return new Allergy(this);
        }
    }
}
