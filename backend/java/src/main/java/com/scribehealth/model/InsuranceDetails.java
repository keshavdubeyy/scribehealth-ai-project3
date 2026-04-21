package com.scribehealth.model;

public class InsuranceDetails {

    private String provider;
    private String policyNumber;
    private String validUntil;

    public InsuranceDetails() {}

    public InsuranceDetails(String provider, String policyNumber) {
        this.provider     = provider;
        this.policyNumber = policyNumber;
    }

    public String getProvider()               { return provider; }
    public void   setProvider(String v)       { this.provider = v; }

    public String getPolicyNumber()           { return policyNumber; }
    public void   setPolicyNumber(String v)   { this.policyNumber = v; }

    public String getValidUntil()             { return validUntil; }
    public void   setValidUntil(String v)     { this.validUntil = v; }
}
