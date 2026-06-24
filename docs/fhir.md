# HL7 FHIR Alignment Documentation
## AI Epilepsy Assistant (AIEA) Project

This document outlines how the AIEA clinical prototype aligns with the **HL7 FHIR (Fast Healthcare Interoperability Resources)** standards to ensure interoperability with national health registries and electronic health records (EHRs).

### 1. Core Resource Mappings

| AIEA Entity | FHIR Resource | Description |
|-------------|---------------|-------------|
| **Patient** | [Patient](https://hl7.org/fhir/R4/patient.html) | Captures demographic and contact details for epilepsy cases. |
| **Encounter** | [Encounter](https://hl7.org/fhir/R4/encounter.html) | Represents the specific clinical interaction (AI-guided or Clinician-certified). |
| **HealthFacility** | [Organization](https://hl7.org/fhir/R4/organization.html) | Represents the referral destinations and regional health clusters. |
| **Clinical Findings** | [Observation](https://hl7.org/fhir/R4/observation.html) | Individual red flags and seizure semiology (mapped within Encounter.reasonCode for MVP). |

---

### 2. Detailed Entity Alignment

#### Patient Resource
AIEA strictly follows the FHIR Patient structure for core demographics:
- `birthDate`: Replaces the non-standard "age" field to ensure data integrity over time.
- `gender`: Uses FHIR-standard administrative gender codes (`male`, `female`, `other`, `unknown`).
- `telecom`: Implements a structured object with `system` (phone) and `value`.
- `address`: Uses structured text and regional identifiers (District/Sector).

#### Encounter Resource
Clinical logs are designed as immutable audit trails:
- `status`: Mapped to standard FHIR states (`planned`, `triaged`, `in-progress`, `finished`).
- `period`: Stores `start` and `end` timestamps for clinical auditing.
- `reasonCode`: Captured as an array of strings representing seizure types and red flags (WHO mhGAP aligned).
- `author`: Uses the `Practitioner` role reference to attribute logs to specific CHWs or Clinicians.

---

### 3. Clinical Logic & Terminology
The "Suggetive AI Analysis" operates on top of these resources. While AIEA uses natural language for the prototype interface, the underlying metadata is structured to facilitate:
- **Logical IDs**: Every record uses a UUID/String ID for consistent referencing.
- **Reference Integrity**: Encounters maintain a strict `subject` reference to the Patient ID.
- **WHO mhGAP Integration**: Clinical outcomes (Urgency Levels: Emergency/Urgent/Routine) are mapped to protocol-driven action codes.

### 4. Implementation Strategy
The project uses a JSON Schema-based backend configuration (`docs/backend.json`) that acts as an **Intermediate Representation (IR)**. This ensures that any data emitted by the AI or saved by the health worker can be serialized into a standard FHIR JSON bundle for API transmission.

---
*© 2026 AI Epilepsy Assistant - Standards & Interoperability Group*
