package com.scribehealth.model;

public class PatientAllergy {

    public enum Severity { mild, moderate, severe }

    private String   substance;
    private Severity severity;
    private String   reaction;

    public PatientAllergy() {}

    public PatientAllergy(String substance, Severity severity) {
        this.substance = substance;
        this.severity  = severity;
    }

    public String   getSubstance()          { return substance; }
    public void     setSubstance(String v)  { this.substance = v; }

    public Severity getSeverity()           { return severity; }
    public void     setSeverity(Severity v) { this.severity = v; }

    public String   getReaction()           { return reaction; }
    public void     setReaction(String v)   { this.reaction = v; }
}
