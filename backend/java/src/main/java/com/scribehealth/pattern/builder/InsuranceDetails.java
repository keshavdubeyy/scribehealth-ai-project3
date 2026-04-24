package com.scribehealth.pattern.builder;

/**
 * Represents insurance details for a patient.
 * Immutable value object.
 */
public class InsuranceDetails {
    
    private final String provider;
    private final String policyNumber;
    private final String groupNumber;
    private final String policyHolderName;
    private final String validUntil; // ISO date format YYYY-MM-DD
    
    private InsuranceDetails(Builder builder) {
        this.provider = builder.provider;
        this.policyNumber = builder.policyNumber;
        this.groupNumber = builder.groupNumber;
        this.policyHolderName = builder.policyHolderName;
        this.validUntil = builder.validUntil;
    }
    
    public String getProvider() {
        return provider;
    }
    
    public String getPolicyNumber() {
        return policyNumber;
    }
    
    public String getGroupNumber() {
        return groupNumber;
    }
    
    public String getPolicyHolderName() {
        return policyHolderName;
    }
    
    public String getValidUntil() {
        return validUntil;
    }
    
    /**
     * Checks if the insurance policy is currently valid.
     * @param currentDate current date in ISO format YYYY-MM-DD
     * @return true if policy is valid (not expired)
     */
    public boolean isValid(String currentDate) {
        if (validUntil == null || validUntil.isEmpty()) {
            return true; // No expiration date means always valid
        }
        return currentDate.compareTo(validUntil) <= 0;
    }
    
    @Override
    public String toString() {
        return String.format("InsuranceDetails{provider='%s', policyNumber='***', groupNumber='%s'}", 
                provider, groupNumber);
    }
    
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private String provider;
        private String policyNumber;
        private String groupNumber;
        private String policyHolderName;
        private String validUntil;
        
        public Builder provider(String provider) {
            this.provider = provider;
            return this;
        }
        
        public Builder policyNumber(String policyNumber) {
            this.policyNumber = policyNumber;
            return this;
        }
        
        public Builder groupNumber(String groupNumber) {
            this.groupNumber = groupNumber;
            return this;
        }
        
        public Builder policyHolderName(String policyHolderName) {
            this.policyHolderName = policyHolderName;
            return this;
        }
        
        public Builder validUntil(String validUntil) {
            this.validUntil = validUntil;
            return this;
        }
        
        public InsuranceDetails build() {
            if (provider == null || provider.isBlank()) {
                throw new IllegalStateException("Insurance provider is required");
            }
            if (policyNumber == null || policyNumber.isBlank()) {
                throw new IllegalStateException("Policy number is required");
            }
            return new InsuranceDetails(this);
        }
    }
}
