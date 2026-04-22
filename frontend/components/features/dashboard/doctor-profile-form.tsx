import React, { FormEvent, useMemo, useState } from "react";
import {
  Allergy,
  AllergySeverity,
  ChronicCondition,
  PatientProfile,
  PatientProfileBuilder,
} from "../../../lib/patient-profile-builder";

interface DoctorProfileFormProps {
  onSubmitProfile?: (profile: PatientProfile) => void;
}

export default function DoctorProfileForm({
  onSubmitProfile,
}: DoctorProfileFormProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");

  const [chronicConditions, setChronicConditions] = useState<ChronicCondition[]>(
    [],
  );
  const [conditionCode, setConditionCode] = useState("");
  const [conditionDescription, setConditionDescription] = useState("");

  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [allergyName, setAllergyName] = useState("");
  const [allergySeverity, setAllergySeverity] = useState<AllergySeverity>("mild");

  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");

  const hasInsuranceInput = useMemo(
    () =>
      Boolean(
        insuranceProvider.trim() ||
          insurancePolicyNumber.trim() ||
          insuranceExpiry.trim(),
      ),
    [insuranceProvider, insurancePolicyNumber, insuranceExpiry],
  );

  const addCondition = () => {
    const icdCode = conditionCode.trim();
    const description = conditionDescription.trim();
    if (!icdCode || !description) {
      return;
    }

    setChronicConditions((prev) => [...prev, { icdCode, description }]);
    setConditionCode("");
    setConditionDescription("");
  };

  const addAllergy = () => {
    const trimmed = allergyName.trim();
    if (!trimmed) {
      return;
    }

    setAllergies((prev) => [...prev, { name: trimmed, severity: allergySeverity }]);
    setAllergyName("");
    setAllergySeverity("mild");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAge = Number(age);
    const builder = new PatientProfileBuilder()
      .setCore(name, parsedAge, gender, email, phone)
      .setCreatedByDoctorEmail(doctorEmail);

    chronicConditions.forEach((condition) =>
      builder.addChronicCondition(condition.icdCode, condition.description),
    );

    allergies.forEach((allergy) => builder.addAllergy(allergy.name, allergy.severity));

    if (emergencyContactName.trim() && emergencyContactPhone.trim()) {
      builder.setEmergencyContact(emergencyContactName, emergencyContactPhone);
    }

    if (
      insuranceProvider.trim() &&
      insurancePolicyNumber.trim() &&
      insuranceExpiry.trim()
    ) {
      builder.setInsuranceDetails({
        provider: insuranceProvider,
        policyNumber: insurancePolicyNumber,
        expiry: insuranceExpiry,
      });
    }

    const profile = builder.build();

    if (onSubmitProfile) {
      onSubmitProfile(profile);
    }

    setName("");
    setAge("");
    setGender("");
    setEmail("");
    setPhone("");
    setDoctorEmail("");
    setChronicConditions([]);
    setAllergies([]);
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setInsuranceProvider("");
    setInsurancePolicyNumber("");
    setInsuranceExpiry("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Patient Profile</h2>

      <label>
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>

      <label>
        Age
        <input
          type="number"
          min={0}
          value={age}
          onChange={(event) => setAge(event.target.value)}
          required
        />
      </label>

      <label>
        Gender
        <input
          value={gender}
          onChange={(event) => setGender(event.target.value)}
          required
        />
      </label>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <label>
        Phone
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
        />
      </label>

      <label>
        Creating Doctor Email
        <input
          type="email"
          value={doctorEmail}
          onChange={(event) => setDoctorEmail(event.target.value)}
          required
        />
      </label>

      <fieldset>
        <legend>Chronic Conditions</legend>
        <input
          value={conditionCode}
          onChange={(event) => setConditionCode(event.target.value)}
          placeholder="I10"
        />
        <input
          value={conditionDescription}
          onChange={(event) => setConditionDescription(event.target.value)}
          placeholder="Hypertension"
        />
        <button type="button" onClick={addCondition}>
          Add Condition
        </button>
        {chronicConditions.length > 0 && (
          <ul>
            {chronicConditions.map((condition, index) => (
              <li key={`${condition.icdCode}-${index}`}>
                {condition.icdCode} - {condition.description}
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <fieldset>
        <legend>Allergies (with severity)</legend>
        <input
          value={allergyName}
          onChange={(event) => setAllergyName(event.target.value)}
          placeholder="Peanuts"
        />
        <select
          value={allergySeverity}
          onChange={(event) =>
            setAllergySeverity(event.target.value as AllergySeverity)
          }
        >
          <option value="mild">Mild</option>
          <option value="moderate">Moderate</option>
          <option value="severe">Severe</option>
        </select>
        <button type="button" onClick={addAllergy}>
          Add Allergy
        </button>

        {allergies.length > 0 && (
          <ul>
            {allergies.map((allergy, index) => (
              <li key={`${allergy.name}-${index}`}>
                {allergy.name} ({allergy.severity})
              </li>
            ))}
          </ul>
        )}
      </fieldset>

      <fieldset>
        <legend>Emergency Contact</legend>
        <label>
          Name
          <input
            value={emergencyContactName}
            onChange={(event) => setEmergencyContactName(event.target.value)}
            placeholder="Jane Doe"
          />
        </label>
        <label>
          Phone
          <input
            value={emergencyContactPhone}
            onChange={(event) => setEmergencyContactPhone(event.target.value)}
            placeholder="+1 555 0100"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Insurance Details</legend>
        <label>
          Provider
          <input
            value={insuranceProvider}
            onChange={(event) => setInsuranceProvider(event.target.value)}
            placeholder="BlueCross"
          />
        </label>
        <label>
          Policy Number
          <input
            value={insurancePolicyNumber}
            onChange={(event) => setInsurancePolicyNumber(event.target.value)}
            placeholder="POL-12345"
          />
        </label>
        <label>
          Expiry
          <input
            type="date"
            value={insuranceExpiry}
            onChange={(event) => setInsuranceExpiry(event.target.value)}
          />
        </label>
        {hasInsuranceInput && !insuranceProvider.trim() && (
          <p>Insurance provider is required when insurance details are provided.</p>
        )}
        {hasInsuranceInput && !insurancePolicyNumber.trim() && (
          <p>Policy number is required when insurance details are provided.</p>
        )}
        {hasInsuranceInput && !insuranceExpiry.trim() && (
          <p>Insurance expiry is required when insurance details are provided.</p>
        )}
      </fieldset>

      <button type="submit">Create Patient Profile</button>
    </form>
  );
}
