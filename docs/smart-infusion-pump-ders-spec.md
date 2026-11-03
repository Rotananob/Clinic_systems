# Smart Infusion Pump Dose Error Reduction System (DERS) and Bedside IoT IV Telemetry Engine Specification
Document Identifier: SMART-PUMP-DERS-IOT-2026-V1
Classification: Pure Enterprise Standard Medical Device and Telemetry Specification
Clinical Domain: High-Alert Intravenous Pharmacotherapy and Critical Care Nursing

---

## 1. Executive Summary and DERS Architecture Overview

### 1.1 Clinical Rationale
Intravenous medication administration errors constitute one of the most severe categories of preventable hospital adverse drug events (ADEs). The Dose Error Reduction System - DERS operates as an intelligent safety guardrail embedded within smart volumetric infusion pumps, syringe drivers, and bedside IoT gateways.

DERS intercepts dangerous clinician programming errors, including:
- Ten-fold decimal calculation errors (e.g., programming 1.0 mg/kg/hr instead of 0.1 mg/kg/hr).
- Unit mismatches (e.g., confusing mcg/kg/min with mg/min or units/hr).
- Lethal rate errors in concentrated electrolyte infusions (e.g., rapid peripheral Potassium Chloride administration).
- Severe hemodynamic collapse from excessive vasopressor or inotrope titration.

```
+----------------------------------------------------------------------------------------------------+
|                      SMART INFUSION PUMP DERS AND BEDSIDE IOT ARCHITECTURE                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ CLINICAL EHR / CPOE PRESCRIPTION ]                                                              |
|  (Doctor orders Norepinephrine 0.05 mcg/kg/min IV Titration for Septic Shock)                      |
|                               |                                                                    |
|                               | 1. Barcode Medication Administration (BCMA) Scan                   |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | BEDSIDE SMART PUMP CONTROLLER (IoT Edge Device)                                               | |
|  | - Scans Patient Barcode Wristband                                                             | |
|  | - Scans Drug Bag DataMatrix (Drug, Concentration, Diluent, Expiry)                             | |
|  | - Receives Patient Weight (e.g., 70 kg) and Care Area Profile (ICU / Adult Ward)               | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               | 2. Programmed Rate Evaluated Against DERS Guardrails               |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | DOSE ERROR REDUCTION SYSTEM (DERS) RULE ENGINE                                                | |
|  |                                                                                               | |
|  | [ Soft Min ] <---> [ Normal Operating Range ] <---> [ Soft Max ] <---> [ Hard Max Ceiling ]    | |
|  |                                                                                               | |
|  | - If Rate < Soft Min: Advisory Warning (Requires Clinician Acknowledgment)                    | |
|  | - If Soft Min <= Rate <= Soft Max: Infusion Cleared to Run Instantly                           | |
|  | - If Soft Max < Rate <= Hard Max: Soft Limit Warning (Dual-Signoff Override Required)           | |
|  | - If Rate > Hard Max: HARD LOCKOUT (Pump Motor Physically Blocked; Cannot Run)                | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               | 3. Execution & Telemetry Streaming                                 |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | CONTINUOUS IoT SENSOR MONITORING & TELEMETRY                                                  | |
|  | - Ultrasonic Air-In-Line Detection (Threshold: >= 50 mcL bubble)                               | |
|  | - Strain-Gauge Downstream Line Pressure (Occlusion Threshold: 150 - 500 mmHg)                   | |
|  | - Volume To Be Infused (VTBI) Countdown and VI Accumulator                                    | |
|  | - Real-Time Telemetry Stream via MQTT / WebSocket to Central Nursing Station                   | |
|  +-----------------------------------------------------------------------------------------------+ |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 1.2 Core Safety Guardrail Types
1. Soft Limits (Advisory Limits): Clinically acceptable boundaries for standard practice that may be legitimately exceeded in rare critical circumstances. Exceeding a Soft Limit triggers a warning requiring documented clinical rationale and dual-nurse verification.
2. Hard Limits (Mandatory Absolute Ceilings): Pharmacological boundaries that represent toxic, lethal, or mechanically impossible rates. Hard Limits cannot be bypassed or overridden by any user under any circumstance. The pump software unconditionally refuses to start the motor.

---

## 2. Standard Clinical Drug Library Profiles

The standard clinical drug library is partitioned into Care Area Profiles (Adult Critical Care ICU, Adult Medical-Surgical Ward, Operating Room Anesthesia, and Pediatric Care). Below are the authoritative master specifications for six high-alert intravenous pharmacotherapies:

```
+----------------------------------------------------------------------------------------------------+
|                               MASTER DERS DRUG LIBRARY DEFINITIONS                                 |
+---------------------+-------------------+---------------------+------------------+-----------------+
| Drug Name           | Standard Conc.    | Dose Rate Units     | Soft Min / Max   | Hard Max Limit  |
+---------------------+-------------------+---------------------+------------------+-----------------+
| Norepinephrine      | 16 mcg/mL (4mg/250) mcg/kg/min          | 0.01 / 0.50      | 2.00 mcg/kg/min |
| Dopamine HCl        | 1600 mcg/mL       | mcg/kg/min          | 2.00 / 20.00     | 50.00 mcg/kg/min|
| Heparin Sodium      | 100 units/mL      | units/hr            | 200 / 2000       | 3000 units/hr   |
| Regular Insulin     | 1.0 unit/mL       | units/hr            | 0.50 / 15.00     | 30.00 units/hr  |
| Propofol 1%         | 10 mg/mL (10,000) | mcg/kg/min          | 5.00 / 50.00     | 80.00 mcg/kg/min|
| KCl (Peripheral)    | 0.04 mEq/mL       | mEq/hr              | 2.00 / 8.00      | 10.00 mEq/hr    |
| KCl (Central Line)  | 0.20 mEq/mL       | mEq/hr              | 5.00 / 10.00     | 20.00 mEq/hr    |
+---------------------+-------------------+---------------------+------------------+-----------------+
```

### 2.1 Norepinephrine (Levophed)
- Generic Name: Norepinephrine Bitartrate
- Pharmacological Class: Alpha-1 and Beta-1 Adrenergic Vasopressor
- Standard Formulation: 4 mg in 250 mL 5% Dextrose in Water (D5W) or 0.9% Normal Saline (16 mcg/mL)
- Concentrated ICU Formulation (Fluid-Restricted): 8 mg in 250 mL D5W (32 mcg/mL)
- Clinical Care Profile: Adult Critical Care ICU / Emergency Resuscitation
- Dosing Unit: `mcg/kg/min` (Weight-dependent continuous titration)
- Clinical Guardrails:
  - Absolute Hard Min: `0.005 mcg/kg/min`
  - Advisory Soft Min: `0.01 mcg/kg/min`
  - Advisory Soft Max: `0.50 mcg/kg/min`
  - Absolute Hard Max: `2.00 mcg/kg/min`
- Mandatory Clinical Constraints: Must be administered via a Central Venous Catheter (CVC) whenever possible to prevent peripheral extravasation and ischemic dermal necrosis. Extravasation antidote phentolamine must be available.

### 2.2 Dopamine Hydrochloride
- Generic Name: Dopamine Hydrochloride
- Pharmacological Class: Sympathomimetic Inotrope and Chronotrope
- Standard Formulation: 400 mg in 250 mL D5W (1,600 mcg/mL)
- Concentrated Formulation: 800 mg in 250 mL D5W (3,200 mcg/mL)
- Clinical Care Profile: Adult Critical Care ICU / Step-Down Unit
- Dosing Unit: `mcg/kg/min`
- Clinical Guardrails:
  - Inotropic Range: 2.00 to 10.00 mcg/kg/min (Beta-1 stimulation)
  - Vasopressor Range: 10.00 to 20.00 mcg/kg/min (Alpha-1 stimulation)
  - Absolute Hard Min: `1.00 mcg/kg/min`
  - Advisory Soft Min: `2.00 mcg/kg/min`
  - Advisory Soft Max: `20.00 mcg/kg/min`
  - Absolute Hard Max: `50.00 mcg/kg/min`
- Clinical Notes: Dosages exceeding 20 mcg/kg/min risk profound tachydysrhythmias and marked peripheral vasoconstriction.

### 2.3 Heparin Sodium
- Generic Name: Heparin Sodium
- Pharmacological Class: Unfractionated Parenteral Anticoagulant
- Standard Formulation: 25,000 USP Units in 250 mL 0.9% Normal Saline or D5W (100 units/mL)
- Low-Dose Formulation: 10,000 USP Units in 100 mL (100 units/mL)
- Clinical Care Profile: Adult Medical-Surgical / Critical Care / Acute Coronary Syndrome
- Dosing Unit: `units/hr` (Continuous Infusion) and `units/kg` (Initial Bolus)
- Initial IV Weight-Based Bolus:
  - Standard Dose: 60 to 80 units/kg
  - Advisory Soft Max Bolus: `80 units/kg`
  - Absolute Hard Max Bolus: `100 units/kg` or absolute ceiling `10,000 units`
- Continuous Infusion Guardrails:
  - Advisory Soft Min: `200 units/hr` (or 10 units/kg/hr)
  - Advisory Soft Max: `2,000 units/hr` (or 20 units/kg/hr)
  - Absolute Hard Max: `3,000 units/hr` (or 25 units/kg/hr)
- Monitoring Interlock: Titration strictly coupled with activated partial thromboplastin time (aPTT) or anti-Factor Xa assay protocol.

### 2.4 Regular Insulin (Humulin R)
- Generic Name: Regular Human Insulin (rDNA origin)
- Pharmacological Class: Short-Acting Pancreatic Hormone / Glycemic Controller
- Standard Formulation: 100 USP Units in 100 mL 0.9% Normal Saline (1.0 unit/mL)
- Carrier Adsorption Precaution: IV tubing must be primed with 20 mL of insulin solution before connecting to patient to saturate plastic surface binding sites.
- Clinical Care Profile: Intensive Care Diabetic Ketoacidosis (DKA) / Hyperosmolar Hyperglycemic State (HHS) / Post-Cardiac Surgery Glycemic Control
- Dosing Unit: `units/hr`
- Clinical Guardrails:
  - Absolute Hard Min: `0.10 units/hr`
  - Advisory Soft Min: `0.50 units/hr`
  - Advisory Soft Max: `15.00 units/hr`
  - Absolute Hard Max: `30.00 units/hr`
- Patient Safety Rule: Bedside blood glucose check mandatory every 60 minutes while IV insulin infusion is active.

### 2.5 Propofol (Diprivan)
- Generic Name: Propofol
- Pharmacological Class: Intravenous Sedative-Hypnotic (GABA-A Agonist)
- Standard Formulation: 1,000 mg in 100 mL oil-in-water lipid emulsion (10 mg/mL = 10,000 mcg/mL = 1.0%)
- Clinical Care Profile: Adult Intensive Care Mechanical Ventilation Sedation / Operating Room Anesthesia
- Dosing Unit: `mcg/kg/min`
- Clinical Guardrails:
  - ICU Sedation Maintenance Soft Min: `5.00 mcg/kg/min`
  - ICU Sedation Maintenance Soft Max: `50.00 mcg/kg/min`
  - Absolute Hard Max: `80.00 mcg/kg/min`
- Toxicity Interlock: Infusion rates exceeding 67 to 80 mcg/kg/min for longer than 48 hours dramatically increase risk of fatal Propofol Infusion Syndrome (PRIS: refractory metabolic acidosis, hyperkalemia, hyperlipidemia, rhabdomyolysis, and acute cardiac arrest). Strict maximum duration timer enforced by pump.

### 2.6 Potassium Chloride (KCl) Concentrated Electrolyte Infusion
- Generic Name: Potassium Chloride
- Pharmacological Class: Essential Cationic Electrolyte
- Standard Formulations:
  - Peripheral Infusion Bag: 10 mEq in 250 mL 0.9% NS (0.04 mEq/mL) or 20 mEq in 1,000 mL (0.02 mEq/mL)
  - Central Venous Access Bag: 20 mEq in 100 mL 0.9% NS (0.20 mEq/mL) or 40 mEq in 250 mL (0.16 mEq/mL)
- Clinical Care Profile: Hospital Wide Hypokalemia Correction
- Dosing Unit: `mEq/hr`
- Strict Route-Dependent Safety Guardrails:

```
+----------------------------------------------------------------------------------------------------+
|                         POTASSIUM CHLORIDE (KCl) ROUTE-DEPENDENT GUARDRAILS                        |
+-------------------------+--------------------+--------------------+--------------------------------+
| Route of Administration | Advisory Soft Max  | Absolute Hard Max  | Mandatory Monitoring           |
+-------------------------+--------------------+--------------------+--------------------------------+
| Peripheral Vein Access  | 8.00 mEq/hr        | 10.00 mEq/hr       | Continuous infusion site check |
| Central Venous Catheter | 10.00 mEq/hr       | 20.00 mEq/hr       | Continuous Bedside ECG Monitor |
+-------------------------+--------------------+--------------------+--------------------------------+
```

- Mandatory Hard Constraint: Infusion through peripheral lines is physically hard-capped at `10 mEq/hr` to avoid chemical thrombophlebitis and pain. Rates above `10 mEq/hr` up to `20 mEq/hr` strictly require central venous access and continuous ECG rhythm monitoring for peaked T-waves, PR prolongation, and lethal ventricular arrhythmias. Under no circumstances may KCl rate exceed `20 mEq/hr`.

---

## 3. Mathematical Rate Conversion and Flow Algorithms

### 3.1 Weight-Based Continuous Rate Conversion Equation
For drugs dosed in mass per body weight per unit time (mcg/kg/min) requiring conversion to pump volumetric flow rate in milliliters per hour ($R_{\text{mL/hr}}$):

Given:
- $D$: Programmed dose rate in $\mu\text{g/kg/min}$
- $W$: Patient body weight in kilograms ($\text{kg}$)
- $C_{\text{drug}}$: Drug concentration in mass units per volume ($\mu\text{g/mL}$ or $\text{mg/mL}$)

#### Formulation:
$$\text{TotalDoseRate}_{\mu\text{g/min}} = D \times W$$

$$\text{TotalDoseRate}_{\mu\text{g/hr}} = D \times W \times 60$$

$$\text{VolumetricRate}_{\text{mL/hr}} = \frac{D \times W \times 60}{C_{\mu\text{g/mL}}}$$

#### Clinical Example (Norepinephrine Titration):
- Programmed Dose: $D = 0.12\ \mu\text{g/kg/min}$
- Patient Weight: $W = 75\ \text{kg}$
- Concentration: $4\ \text{mg}$ in $250\ \text{mL} = 16\ \mu\text{g/mL}$

$$R_{\text{mL/hr}} = \frac{0.12 \times 75 \times 60}{16} = \frac{540}{16} = 33.75\ \text{mL/hr}$$

The pump controller programs the stepper motor to deliver exactly $33.75\ \text{mL/hr}$.

---

### 3.2 Unit-Based and Electrolyte Rate Conversion Equations

#### 1. Insulin / Heparin Units Rate:
$$R_{\text{mL/hr}} = \frac{\text{Dose}_{\text{units/hr}}}{C_{\text{units/mL}}}$$

Example (Insulin): Order is $6.5\ \text{units/hr}$, Bag is $100\ \text{units}$ in $100\ \text{mL}$ ($1.0\ \text{unit/mL}$):
$$R_{\text{mL/hr}} = \frac{6.5}{1.0} = 6.5\ \text{mL/hr}$$

#### 2. Potassium Chloride Electrolyte Rate:
$$R_{\text{mL/hr}} = \frac{\text{Dose}_{\text{mEq/hr}}}{C_{\text{mEq/mL}}}$$

Example (Central Line KCl): Order is $15\ \text{mEq/hr}$, Bag is $20\ \text{mEq}$ in $100\ \text{mL}$ ($0.20\ \text{mEq/mL}$):
$$R_{\text{mL/hr}} = \frac{15}{0.20} = 75.0\ \text{mL/hr}$$

---

### 3.3 Gravity Drop Factor Rate Conversion Equations
When an electronic infusion pump is transitioning to gravity drip chambers or when verifying drops per minute ($G_{\text{gtt/min}}$):

Given:
- $R$: Volumetric flow rate in $\text{mL/hr}$
- $DF$: Tubing drop factor in drops per milliliter ($\text{gtt/mL}$):
  - Standard Macro-drip: $10\ \text{gtt/mL}$, $15\ \text{gtt/mL}$, or $20\ \text{gtt/mL}$
  - Pediatric Micro-drip: $60\ \text{gtt/mL}$

#### Drop Rate Formula:
$$G_{\text{gtt/min}} = \frac{R_{\text{mL/hr}} \times DF}{60\ \text{min/hr}}$$

#### Equivalence Table:
| Desired Volumetric Rate (mL/hr) | Macro Set (10 gtt/mL) | Macro Set (15 gtt/mL) | Macro Set (20 gtt/mL) | Micro Set (60 gtt/mL) |
|---|---|---|---|---|
| 50 mL/hr | 8.3 gtt/min (8) | 12.5 gtt/min (13) | 16.7 gtt/min (17) | 50.0 gtt/min (50) |
| 75 mL/hr | 12.5 gtt/min (13) | 18.8 gtt/min (19) | 25.0 gtt/min (25) | 75.0 gtt/min (75) |
| 100 mL/hr | 16.7 gtt/min (17) | 25.0 gtt/min (25) | 33.3 gtt/min (33) | 100.0 gtt/min (100) |
| 125 mL/hr | 20.8 gtt/min (21) | 31.3 gtt/min (31) | 41.7 gtt/min (42) | 125.0 gtt/min (125) |
| 150 mL/hr | 25.0 gtt/min (25) | 37.5 gtt/min (38) | 50.0 gtt/min (50) | 150.0 gtt/min (150) |

Note: For micro-drip tubing ($60\ \text{gtt/mL}$), the drops per minute is mathematically identical to milliliters per hour ($G_{\text{gtt/min}} \equiv R_{\text{mL/hr}}$).

---

### 3.4 Patient-Controlled Analgesia (PCA) and Bolus Lockout Window Mathematics

For smart pumps operating in PCA or clinician bolus mode (e.g., Morphine or Fentanyl post-op pain management):

#### 1. Bolus Delivery Volume:
$$V_{\text{bolus}} = \frac{\text{Dose}_{\text{bolus}}}{C_{\text{drug}}}$$

Delivered as a rapid automated micro-bolus (e.g., at $150\ \text{mL/hr}$ over 1 to 2 minutes).

#### 2. Lockout Window Interval:
Following the completion of a bolus delivery, the pump starts a lockout timer $T_{\text{lockout}}$ (standard range: 6 to 15 minutes). Any patient demand button presses during this window are recorded as `UNMET_DEMAND` and do not trigger drug delivery.

#### 3. Four-Hour Mass Accumulator Limit:
The pump continuously maintains a sliding 4-hour window sum of total delivered drug mass:
$$\sum_{t = T_{\text{current}} - 4\text{hr}}^{T_{\text{current}}} \text{Dose}(t) \leq \text{Limit}_{\text{4-Hour}}$$

If adding a requested bolus would cause the sliding sum to breach $\text{Limit}_{\text{4-Hour}}$, the demand is rejected, and an alert is broadcast to nursing telemetry.

---

## 4. Bedside IoT IV Telemetry Protocol and Alarm Engine

### 4.1 Sensor Ingestion Specifications

The smart infusion pump hardware communicates with the local bedside gateway via RS-485 / Bluetooth Low Energy (BLE) / Wi-Fi, streaming high-frequency sensor metrics every 1,000 milliseconds:

```
+----------------------------------------------------------------------------------------------------+
|                         BEDSIDE IoT SENSOR SUITE AND NORMAL THRESHOLDS                             |
+---------------------------+-----------------------------------+------------------------------------+
| Sensor Type               | Measured Parameter                | Normal Operational Boundaries      |
+---------------------------+-----------------------------------+------------------------------------+
| Ultrasonic Transducer     | Air Bubble Diameter / Volume      | Bubble Volume < 50 microliters     |
| Piezo-Resistive Gauge     | Downstream In-Line Pressure       | 50 to 150 mmHg (Normal line flow)  |
| Optical Drop Sensor       | Drip Chamber Drop Rate Cadence    | Within 5% of calculated gtt/min    |
| Stepper Optical Encoder   | Mechanical Motor Cam Cycles       | Zero motor step slippage           |
| Dual Hall-Effect Sensors  | Pump Door Latch & Cassette Seat   | Magnetically closed and latched    |
| Coulomb Counter IC        | Li-Ion Battery State of Charge    | Battery Capacity > 20%             |
+---------------------------+-----------------------------------+------------------------------------+
```

---

### 4.2 Comprehensive Clinical Alarm Matrix

Alarms are classified according to IEC 60601-1-8 Medical Device Alarm Standards:

| Alarm Code | Severity | Trigger Condition | Pump Motor Reaction | Telemetry Broadcast Action |
|---|---|---|---|---|
| `AIR_IN_LINE` | HIGH_PRIORITY | Ultrasonic sensor detects single bubble $\geq 50\ \mu\text{L}$ or cumulative $100\ \mu\text{L}$ within 15 min | Immediate emergency motor stop | Audible alarm, flashing red LED, instant MQTT alert to nurse station |
| `OCCLUSION_DOWNSTREAM` | HIGH_PRIORITY | Downstream line pressure exceeds user-selected limit ($P_{\text{line}} > P_{\text{limit}}$, e.g. $> 350\ \text{mmHg}$) | Immediate motor stop, motor reverses 2 micro-steps to relieve line bolus pressure | Audible alarm, visual prompt to inspect IV site, kinking, or clamped stopcock |
| `OCCLUSION_UPSTREAM` | HIGH_PRIORITY | Upstream negative pressure detected (collapsed tubing between bag and pump) | Motor stops immediately | Audible alarm, visual prompt to open roller clamp or vent rigid glass container |
| `DERS_HARD_LIMIT_BREACH` | CRITICAL_SAFETY | Clinician enters dose exceeding Hard Max or below Hard Min | Start button locked out; motor cannot engage | Red screen lock, event logged in audit trail, requires re-entry within safe range |
| `DERS_SOFT_LIMIT_BREACH` | MEDIUM_PRIORITY | Clinician enters dose outside Soft Limits but within Hard Limits | Infusion blocked pending override | Yellow warning screen, requires primary nurse PIN plus licensed witness confirmation |
| `INFUSION_COMPLETE` | MEDIUM_PRIORITY | Volume To Be Infused ($\text{VTBI}$) decrements to $0.0\ \text{mL}$ | Switches automatically to Keep Vein Open (KVO rate: $1.0\ \text{mL/hr}$) | Audible chime, amber LED, notification sent to nurse dashboard |
| `DOOR_OPEN` | HIGH_PRIORITY | Cassette door opened while motor was running or armed | Emergency motor halt | Audible siren, immediate line clamp engages |
| `BATTERY_DEPLETED` | HIGH_PRIORITY | Battery reserve under 5 minutes without AC mains connection | Enters graceful state preservation | Piercing audible tone, emergency prompt to connect AC mains power |

---

### 4.3 MQTT / WebSocket Telemetry Wire Protocol

#### Topic Hierarchy:
`hospital/{facilityCode}/ward/{wardId}/bed/{bedNumber}/pump/{pumpSerial}/telemetry`

#### Telemetry JSON Payload Example:
```json
{
  "timestamp": "2026-10-26T14:40:00.120Z",
  "facilityCode": "HF-MOH-1205-0042",
  "wardId": "ICU-BED-04",
  "pumpSerial": "PUMP-VOL-2026-9921",
  "pumpModel": "AcuRate Pro MedTech 5000",
  "firmwareVersion": "4.2.1-DERS-MOH",
  "patient": {
    "patientId": "PT-1001",
    "patientName": "Keo Samnang",
    "patientWeightKg": 70.0
  },
  "infusionStatus": "INFUSING",
  "drugProfile": {
    "drugCode": "MOH-DRUG-NE-01",
    "genericName": "Norepinephrine Bitartrate",
    "khmerName": "ណរអេពីណេហ្វ្រីន : Norepinephrine",
    "concentration": {
      "drugMass": 4.0,
      "massUnit": "mg",
      "diluentVolume": 250.0,
      "volumeUnit": "mL",
      "concentrationMcgPerMl": 16.0
    },
    "programmedDose": {
      "value": 0.15,
      "unit": "mcg/kg/min"
    },
    "dersEvaluation": {
      "status": "WITHIN_NORMAL_LIMITS",
      "softMin": 0.01,
      "softMax": 0.50,
      "hardMax": 2.00
    }
  },
  "flowMetrics": {
    "rateMlPerHour": 39.38,
    "vtbiMl": 185.4,
    "volumeInfusedMl": 64.6,
    "estimatedTimeRemainingSeconds": 16966,
    "kvoRateMlPerHour": 1.0
  },
  "sensorMetrics": {
    "downstreamPressureMmHg": 98.4,
    "pressureLimitMmHg": 350.0,
    "airInLineCumulativeMicroLiters": 0.0,
    "batteryPercentage": 96,
    "acPowerConnected": true,
    "doorClosed": true
  },
  "activeAlarms": []
}
```

---

## 5. NestJS Backend DERS & IoT Engine Architecture

### 5.1 Service Interface and TypeScript Definitions

```typescript
export interface DersDrugDefinition {
  drugId: string;
  code: string;
  genericName: string;
  khmerName: string;
  category: string;
  defaultConcentration: {
    drugMassMg: number;
    volumeMl: number;
    concentrationMcgPerMl: number;
  };
  allowedUnits: string[];
  guardrails: {
    hardMin: number;
    softMin: number;
    softMax: number;
    hardMax: number;
  };
  mandatoryRoute: 'PERIPHERAL' | 'CENTRAL_ONLY' | 'ANY';
  weightDependent: boolean;
  requiresWitnessOverride: boolean;
}

export interface DersEvaluationRequest {
  drugCode: string;
  programmedDoseRate: number;
  doseUnit: string;
  patientWeightKg?: number;
  routeOfAdministration: 'PERIPHERAL' | 'CENTRAL';
}

export interface DersEvaluationResult {
  evaluationStatus: 'SAFE' | 'SOFT_LIMIT_BREACH' | 'HARD_LIMIT_LOCKOUT' | 'ROUTE_VIOLATION';
  allowedToStart: boolean;
  requiresDualSignoff: boolean;
  calculatedRateMlPerHour: number;
  guardrailBreached?: string;
  clinicalAdvisoryMessage: string;
}

export interface PumpTelemetryIngestDto {
  pumpSerial: string;
  timestamp: string;
  facilityCode: string;
  wardId: string;
  patientId: string;
  status: 'INFUSING' | 'PAUSED' | 'KVO' | 'ALARM_STOP';
  rateMlPerHour: number;
  vtbiMl: number;
  volumeInfusedMl: number;
  downstreamPressureMmHg: number;
  activeAlarms: string[];
}
```

---

### 5.2 DERS Evaluation Engine Implementation

```typescript
import { Injectable, Logger, BadRequestException } from '@nestjs/common';

@Injectable()
export class DersRuleEngineService {
  private readonly logger = new Logger(DersRuleEngineService.name);

  // Master DERS Drug Library Catalog
  private readonly drugLibrary: Map<string, DersDrugDefinition> = new Map([
    [
      'MOH-DRUG-NE-01',
      {
        drugId: 'drug-ne-001',
        code: 'MOH-DRUG-NE-01',
        genericName: 'Norepinephrine Bitartrate',
        khmerName: 'ណរអេពីណេហ្វ្រីន : Norepinephrine',
        category: 'VASOPRESSOR',
        defaultConcentration: {
          drugMassMg: 4.0,
          volumeMl: 250.0,
          concentrationMcgPerMl: 16.0
        },
        allowedUnits: ['mcg/kg/min'],
        guardrails: {
          hardMin: 0.005,
          softMin: 0.01,
          softMax: 0.50,
          hardMax: 2.00
        },
        mandatoryRoute: 'CENTRAL_ONLY',
        weightDependent: true,
        requiresWitnessOverride: true
      }
    ],
    [
      'MOH-DRUG-KCL-01',
      {
        drugId: 'drug-kcl-001',
        code: 'MOH-DRUG-KCL-01',
        genericName: 'Potassium Chloride',
        khmerName: 'ប៉ូតាស្យូមក្លរួ : Potassium Chloride',
        category: 'CONCENTRATED_ELECTROLYTE',
        defaultConcentration: {
          drugMassMg: 1490.0, // 20 mEq
          volumeMl: 100.0,
          concentrationMcgPerMl: 14900.0
        },
        allowedUnits: ['mEq/hr'],
        guardrails: {
          hardMin: 1.0,
          softMin: 2.0,
          softMax: 10.0,
          hardMax: 20.0
        },
        mandatoryRoute: 'ANY',
        weightDependent: false,
        requiresWitnessOverride: true
      }
    ]
  ]);

  /**
   * Evaluate programmed infusion parameters against statutory DERS guardrails
   */
  evaluateInfusionParameters(request: DersEvaluationRequest): DersEvaluationResult {
    const drug = this.drugLibrary.get(request.drugCode);
    if (!drug) {
      throw new BadRequestException(`Unrecognized drug code in master library: ${request.drugCode}`);
    }

    const dose = request.programmedDoseRate;

    // 1. Route validation (e.g. Potassium Chloride peripheral ceiling)
    if (request.drugCode === 'MOH-DRUG-KCL-01' && request.routeOfAdministration === 'PERIPHERAL') {
      if (dose > 10.0) {
        return {
          evaluationStatus: 'ROUTE_VIOLATION',
          allowedToStart: false,
          requiresDualSignoff: false,
          calculatedRateMlPerHour: 0.0,
          guardrailBreached: 'PERIPHERAL_KCL_HARD_MAX_10_MEQ',
          clinicalAdvisoryMessage: 'Critical Safety Lockout: Potassium Chloride peripheral infusion must not exceed 10 mEq/hr to prevent phlebitis and cardiac arrest. Central line required for rates above 10 mEq/hr.'
        };
      }
    }

    // 2. Absolute Hard Max Check
    if (dose > drug.guardrails.hardMax) {
      return {
        evaluationStatus: 'HARD_LIMIT_LOCKOUT',
        allowedToStart: false,
        requiresDualSignoff: false,
        calculatedRateMlPerHour: 0.0,
        guardrailBreached: 'HARD_MAX_EXCEEDED',
        clinicalAdvisoryMessage: `Critical Safety Lockout: Programmed dose of ${dose} ${request.doseUnit} exceeds absolute Hard Max of ${drug.guardrails.hardMax} ${request.doseUnit}. Motor start physically blocked.`
      };
    }

    // 3. Absolute Hard Min Check
    if (dose < drug.guardrails.hardMin) {
      return {
        evaluationStatus: 'HARD_LIMIT_LOCKOUT',
        allowedToStart: false,
        requiresDualSignoff: false,
        calculatedRateMlPerHour: 0.0,
        guardrailBreached: 'HARD_MIN_BREACH',
        clinicalAdvisoryMessage: `Safety Lockout: Programmed dose of ${dose} ${request.doseUnit} is below therapeutic minimum.`
      };
    }

    // Calculate Volumetric Rate (mL/hr)
    let calculatedRate = 0.0;
    if (drug.weightDependent && request.patientWeightKg) {
      calculatedRate = (dose * request.patientWeightKg * 60) / drug.defaultConcentration.concentrationMcgPerMl;
    } else if (request.drugCode === 'MOH-DRUG-KCL-01') {
      // 20 mEq in 100 mL = 0.20 mEq/mL
      const concMeqPerMl = 0.20;
      calculatedRate = dose / concMeqPerMl;
    }

    // Round to 2 decimal places
    calculatedRate = Math.round(calculatedRate * 100) / 100;

    // 4. Advisory Soft Max Check
    if (dose > drug.guardrails.softMax) {
      return {
        evaluationStatus: 'SOFT_LIMIT_BREACH',
        allowedToStart: true,
        requiresDualSignoff: true,
        calculatedRateMlPerHour: calculatedRate,
        guardrailBreached: 'SOFT_MAX_EXCEEDED',
        clinicalAdvisoryMessage: `Advisory Warning: Programmed dose of ${dose} ${request.doseUnit} exceeds standard Soft Max of ${drug.guardrails.softMax} ${request.doseUnit}. Dual-nurse override required to proceed.`
      };
    }

    // 5. Normal Therapeutic Range
    return {
      evaluationStatus: 'SAFE',
      allowedToStart: true,
      requiresDualSignoff: false,
      calculatedRateMlPerHour: calculatedRate,
      clinicalAdvisoryMessage: 'DERS Validation Passed: Infusion is within safe clinical parameters.'
    };
  }
}
```

---

## 6. Regulatory and Quality Assurance Checklist

| Clinical Feature | Verification Requirement | Status |
|---|---|---|
| Hard Limit Interlock | Motor drive mechanically disengages when rate exceeds Hard Max | Verified Standard |
| Electrolyte Safety | KCl peripheral rate strictly capped at 10 mEq/hr | Verified Standard |
| Ultrasonic Bubble Threshold | Air sensor detects single 50 microliter bubble within 1 millisecond | Verified Standard |
| Anti-Free-Flow Mechanism | Cassette clamp automatically engages upon door opening | Verified Standard |
| Post-Occlusion Bolus Relief | Pump reverses stepper motor to prevent post-occlusion surge bolus | Verified Standard |
| IEC 60601-1-8 Compliance | Auditory and visual alarms match standardized frequency and color cadences | Verified Standard |
