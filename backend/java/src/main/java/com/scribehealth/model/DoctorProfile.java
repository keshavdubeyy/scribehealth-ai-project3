package com.scribehealth.model;

public class DoctorProfile {

    private String specialization;
    private String licenseNumber;

    public DoctorProfile() {}

    public DoctorProfile(String specialization, String licenseNumber) {
        this.specialization = specialization;
        this.licenseNumber = licenseNumber;
    }

    public String getSpecialization() {
        return specialization;
    }

    public void setSpecialization(String specialization) {
        this.specialization = specialization;
    }

    public String getLicenseNumber() {
        return licenseNumber;
    }

    public void setLicenseNumber(String licenseNumber) {
        this.licenseNumber = licenseNumber;
    }
}
