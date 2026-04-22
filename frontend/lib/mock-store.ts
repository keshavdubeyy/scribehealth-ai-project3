import {
  Allergy,
  ChronicCondition,
  InsuranceDetails,
  PatientProfile,
  PatientProfileBuilder,
} from "./patient-profile-builder";

export interface CreatePatientInput {
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  createdByDoctorEmail: string;
  chronicConditions?: ChronicCondition[];
  allergies?: Allergy[];
  emergencyContact?: {
    name: string;
    phone: string;
  };
  insuranceDetails?: InsuranceDetails;
}

const patientProfiles: PatientProfile[] = [];

export function createPatientProfile(input: CreatePatientInput): PatientProfile {
  const builder = new PatientProfileBuilder()
    .setCore(input.name, input.age, input.gender, input.email, input.phone)
    .setCreatedByDoctorEmail(input.createdByDoctorEmail);

  input.chronicConditions?.forEach((condition) =>
    builder.addChronicCondition(condition.icdCode, condition.description),
  );

  input.allergies?.forEach((allergy) =>
    builder.addAllergy(allergy.name, allergy.severity),
  );

  if (input.emergencyContact) {
    builder.setEmergencyContact(
      input.emergencyContact.name,
      input.emergencyContact.phone,
    );
  }

  if (input.insuranceDetails) {
    builder.setInsuranceDetails(input.insuranceDetails);
  }

  const patientProfile = builder.build();
  patientProfiles.push(patientProfile);

  return patientProfile;
}

export function getPatientProfiles(): PatientProfile[] {
  return [...patientProfiles];
}
