package com.scribehealth.model;

public class ChronicCondition {

    private String name;
    private String icdCode;
    private Integer diagnosedYear;

    public ChronicCondition() {}

    public ChronicCondition(String name) {
        this.name = name;
    }

    public String  getName()                   { return name; }
    public void    setName(String v)           { this.name = v; }

    public String  getIcdCode()                { return icdCode; }
    public void    setIcdCode(String v)        { this.icdCode = v; }

    public Integer getDiagnosedYear()          { return diagnosedYear; }
    public void    setDiagnosedYear(Integer v) { this.diagnosedYear = v; }
}
