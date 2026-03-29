from pydantic import BaseModel, Field
from typing import List, Optional


class Medication(BaseModel):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None          # oral, IV, topical, inhaled


class Vital(BaseModel):
    type: str                             # BP, HR, SpO2, Temperature, RR
    value: str                            # "130/85", "98.6°F", "98%"


class MedicalEntities(BaseModel):
    symptoms: List[str]          = Field(default_factory=list)
    diagnoses: List[str]         = Field(default_factory=list)
    medications: List[Medication]= Field(default_factory=list)
    allergies: List[str]         = Field(default_factory=list)
    vitals: List[Vital]          = Field(default_factory=list)
    treatment_plan: List[str]    = Field(default_factory=list)
    follow_up: Optional[str]     = None
    negated_findings: List[str]  = Field(default_factory=list)  # e.g. "no fever"
