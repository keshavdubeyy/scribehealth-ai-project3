package com.scribehealth.model;

public class EmergencyContact {

    private String name;
    private String relationship;
    private String phone;

    public EmergencyContact() {}

    public EmergencyContact(String name, String phone) {
        this.name  = name;
        this.phone = phone;
    }

    public String getName()                    { return name; }
    public void   setName(String v)            { this.name = v; }

    public String getRelationship()            { return relationship; }
    public void   setRelationship(String v)    { this.relationship = v; }

    public String getPhone()                   { return phone; }
    public void   setPhone(String v)           { this.phone = v; }
}
