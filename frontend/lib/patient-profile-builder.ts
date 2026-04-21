import type {
  ChronicCondition,
  Allergy,
  EmergencyContact,
  InsuranceDetails,
} from "@/lib/mock-store"

export class PatientProfileValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PatientProfileValidationError"
  }
}

export interface PatientProfile {
  name: string
  age: number
  gender: string
  email?: string
  phone?: string
  chronicConditions?: ChronicCondition[]
  allergies?: Allergy[]
  emergencyContact?: EmergencyContact
  insuranceDetails?: InsuranceDetails
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ICD_RE   = /^[A-Z][0-9]{2}(\.[0-9]+)?$/

function digitCount(s: string): number {
  return (s.match(/\d/g) ?? []).length
}

export class PatientProfileBuilder {
  private readonly _name: string
  private readonly _age: number
  private readonly _gender: string
  private _email?: string
  private _phone?: string
  private _chronicConditions?: ChronicCondition[]
  private _allergies?: Allergy[]
  private _emergencyContact?: EmergencyContact
  private _insuranceDetails?: InsuranceDetails

  constructor(name: string, age: number, gender: string) {
    this._name   = name
    this._age    = age
    this._gender = gender
  }

  withEmail(email: string): this {
    this._email = email
    return this
  }

  withPhone(phone: string): this {
    this._phone = phone
    return this
  }

  withChronicConditions(conditions: ChronicCondition[]): this {
    this._chronicConditions = conditions
    return this
  }

  withAllergies(allergies: Allergy[]): this {
    this._allergies = allergies
    return this
  }

  withEmergencyContact(contact: EmergencyContact): this {
    this._emergencyContact = contact
    return this
  }

  withInsurance(details: InsuranceDetails): this {
    this._insuranceDetails = details
    return this
  }

  build(): PatientProfile {
    const name   = this._name.trim()
    const gender = this._gender.trim()

    if (name.length === 0)    throw new PatientProfileValidationError("Patient name is required.")
    if (name.length > 100)    throw new PatientProfileValidationError("Patient name must be 100 characters or fewer.")
    if (this._age < 0 || this._age > 150) throw new PatientProfileValidationError("Age must be between 0 and 150.")
    if (gender.length === 0)  throw new PatientProfileValidationError("Gender is required.")

    if (this._email && !EMAIL_RE.test(this._email)) {
      throw new PatientProfileValidationError("Email address is not valid.")
    }

    if (this._phone && digitCount(this._phone) < 7) {
      throw new PatientProfileValidationError("Phone number must contain at least 7 digits.")
    }

    if (this._chronicConditions) {
      for (const c of this._chronicConditions) {
        if (!c.name.trim()) throw new PatientProfileValidationError("Chronic condition name cannot be empty.")
        if (c.icdCode && !ICD_RE.test(c.icdCode)) {
          throw new PatientProfileValidationError(`ICD code "${c.icdCode}" is not valid. Expected format: A00 or A00.0`)
        }
      }
    }

    if (this._allergies) {
      const validSeverity = ["mild", "moderate", "severe"]
      for (const a of this._allergies) {
        if (!a.substance.trim()) throw new PatientProfileValidationError("Allergy substance cannot be empty.")
        if (!validSeverity.includes(a.severity)) {
          throw new PatientProfileValidationError(`Allergy severity must be mild, moderate, or severe.`)
        }
      }
    }

    if (this._emergencyContact) {
      const ec = this._emergencyContact
      if (!ec.name.trim())  throw new PatientProfileValidationError("Emergency contact name is required.")
      if (!ec.phone.trim()) throw new PatientProfileValidationError("Emergency contact phone is required.")
      if (digitCount(ec.phone) < 7) throw new PatientProfileValidationError("Emergency contact phone must contain at least 7 digits.")
    }

    if (this._insuranceDetails) {
      const ins = this._insuranceDetails
      if (!ins.provider.trim())      throw new PatientProfileValidationError("Insurance provider is required.")
      if (!ins.policyNumber.trim())  throw new PatientProfileValidationError("Insurance policy number is required.")
    }

    return {
      name:               name,
      age:                this._age,
      gender:             gender,
      email:              this._email,
      phone:              this._phone,
      chronicConditions:  this._chronicConditions,
      allergies:          this._allergies,
      emergencyContact:   this._emergencyContact,
      insuranceDetails:   this._insuranceDetails,
    }
  }
}
