package com.scribehealth.dto;

import com.scribehealth.model.ChronicCondition;
import com.scribehealth.model.EmergencyContact;
import com.scribehealth.model.InsuranceDetails;
import com.scribehealth.model.PatientAllergy;

import java.util.List;

public class CreatePatientRequest {

    private String name;
    private Integer age;
    private String gender;
    private String email;
    private String phone;
    private List<ChronicCondition> chronicConditions;
    private List<PatientAllergy>   allergies;
    private EmergencyContact       emergencyContact;
    private InsuranceDetails       insuranceDetails;

    public String  getName()                                      { return name; }
    public void    setName(String v)                              { this.name = v; }

    public Integer getAge()                                       { return age; }
    public void    setAge(Integer v)                              { this.age = v; }

    public String  getGender()                                    { return gender; }
    public void    setGender(String v)                            { this.gender = v; }

    public String  getEmail()                                     { return email; }
    public void    setEmail(String v)                             { this.email = v; }

    public String  getPhone()                                     { return phone; }
    public void    setPhone(String v)                             { this.phone = v; }

    public List<ChronicCondition> getChronicConditions()          { return chronicConditions; }
    public void setChronicConditions(List<ChronicCondition> v)    { this.chronicConditions = v; }

    public List<PatientAllergy>   getAllergies()                   { return allergies; }
    public void setAllergies(List<PatientAllergy> v)              { this.allergies = v; }

    public EmergencyContact getEmergencyContact()                 { return emergencyContact; }
    public void setEmergencyContact(EmergencyContact v)           { this.emergencyContact = v; }

    public InsuranceDetails getInsuranceDetails()                 { return insuranceDetails; }
    public void setInsuranceDetails(InsuranceDetails v)           { this.insuranceDetails = v; }
}
