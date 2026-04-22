export type AllergySeverity = "mild" | "moderate" | "severe";

export interface ChronicCondition {
  icdCode: string;
  description: string;
}

export interface Allergy {
  name: string;
  severity: AllergySeverity;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface InsuranceDetails {
  provider: string;
  policyNumber: string;
  expiry: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  createdByDoctorEmail: string;
  chronicConditions: ChronicCondition[];
  allergies: Allergy[];
  emergencyContact?: EmergencyContact;
  insuranceDetails?: InsuranceDetails;
  createdAt: string;
}

export class PatientProfileBuilder {
  private static readonly KNOWN_ICD_CODES = new Set([
    "E11.9",
    "I10",
    "J45.909",
    "E78.5",
    "M54.5",
  ]);

  private profile: Partial<PatientProfile> = {
    chronicConditions: [],
    allergies: [],
  };

  setCore(
    name: string,
    age: number,
    gender: string,
    email: string,
    phone: string,
  ): this {
    this.profile.name = name.trim();
    this.profile.age = age;
    this.profile.gender = gender.trim();
    this.profile.email = email.trim();
    this.profile.phone = phone.trim();
    return this;
  }

  setCreatedByDoctorEmail(doctorEmail: string): this {
    this.profile.createdByDoctorEmail = doctorEmail.trim();
    return this;
  }

  addChronicCondition(icdCode: string, description: string): this {
    const normalizedCode = icdCode.trim();
    const normalizedDescription = description.trim();
    if (!normalizedCode || !normalizedDescription) {
      return this;
    }

    this.profile.chronicConditions?.push({
      icdCode: normalizedCode,
      description: normalizedDescription,
    });
    return this;
  }

  addAllergy(substance: string, severity: AllergySeverity): this {
    const trimmedSubstance = substance.trim();
    if (!trimmedSubstance) {
      return this;
    }

    this.profile.allergies?.push({ name: trimmedSubstance, severity });
    return this;
  }

  setEmergencyContact(name: string, phone: string): this {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) {
      return this;
    }

    this.profile.emergencyContact = {
      name: trimmedName,
      phone: trimmedPhone,
    };
    return this;
  }

  setInsuranceDetails(details: InsuranceDetails): this {
    const provider = details.provider.trim();
    const policyNumber = details.policyNumber.trim();
    const expiry = details.expiry.trim();

    if (!provider || !policyNumber || !expiry) {
      return this;
    }

    this.profile.insuranceDetails = {
      provider,
      policyNumber,
      expiry,
    };

    return this;
  }

  build(): PatientProfile {
    if (!this.profile.name) {
      throw new Error("Patient name is required.");
    }
    if (!this.profile.age || this.profile.age <= 0) {
      throw new Error("Patient age must be a positive number.");
    }
    if (!this.profile.gender) {
      throw new Error("Patient gender is required.");
    }
    if (!this.profile.email || !this.profile.email.includes("@")) {
      throw new Error("A valid patient email is required.");
    }
    if (!this.profile.phone) {
      throw new Error("Patient phone is required.");
    }
    if (!this.profile.createdByDoctorEmail) {
      throw new Error("Creating doctor context is required.");
    }

    for (const condition of this.profile.chronicConditions ?? []) {
      if (!PatientProfileBuilder.KNOWN_ICD_CODES.has(condition.icdCode)) {
        throw new Error(`Invalid ICD code for chronic condition: ${condition.icdCode}`);
      }
    }

    const contact = this.profile.emergencyContact;
    if (contact && (!contact.name?.trim() || !contact.phone?.trim())) {
      throw new Error(
        "Emergency contact is partially filled: both name and phone are required.",
      );
    }

    const insurance = this.profile.insuranceDetails;
    if (
      insurance &&
      (!insurance.provider?.trim() ||
        !insurance.policyNumber?.trim() ||
        !insurance.expiry)
    ) {
      throw new Error(
        "Insurance details are partially filled: provider, policy number, and expiry are required.",
      );
    }

    return {
      id: this.profile.id ?? `patient-${Date.now()}`,
      name: this.profile.name,
      age: this.profile.age,
      gender: this.profile.gender,
      email: this.profile.email,
      phone: this.profile.phone,
      createdByDoctorEmail: this.profile.createdByDoctorEmail,
      chronicConditions: this.profile.chronicConditions ?? [],
      allergies: this.profile.allergies ?? [],
      ...(this.profile.emergencyContact
        ? { emergencyContact: this.profile.emergencyContact }
        : {}),
      ...(this.profile.insuranceDetails
        ? { insuranceDetails: this.profile.insuranceDetails }
        : {}),
      createdAt: new Date().toISOString(),
    };
  }
}
