# Bedside Multi-Parameter Physiological Vital Signs Monitor and Arrhythmia Waveform Engine Specification
Document Identifier: BEDSIDE-MONITOR-TELEMETRY-SPEC-2026-V1
Compliance Standards: IEEE 11073-10101 (Point-of-Care Medical Device Communication), IEC 60601-2-27 (ECG Safety and Performance), IEC 60601-1-8 (Medical Alarm Systems)
Classification: Pure Enterprise Standard Clinical Telemetry Architecture

---

## 1. Executive Summary and Architecture Overview

### 1.1 Clinical Telemetry Domain
In Intensive Care Units (ICU), Operating Rooms (OR), Emergency Departments (ED), and Post-Anesthesia Care Units (PACU), real-time physiological telemetry systems provide non-invasive and invasive hemodynamic surveillance. Continuous monitoring intercepts life-threatening arrhythmias, hypoxic events, acute hemodynamic instability, and respiratory collapse.

The architecture specified herein establishes:
1. Signal acquisition metrics and mathematical derivations for 5 primary monitoring modalities: ECG Lead II, Pulse Oximetry (SpO2 / Plethysmograph), Non-Invasive / Invasive Blood Pressure (NIBP / IBP), Impedance Pneumography and Capnography (RESP / EtCO2), and Dual-Channel Core-Peripheral Temperature (T1, T2, Delta T).
2. Diagnostic arrhythmia classification taxonomy and decision rules.
3. Multi-tier alarm management conforming to IEC 60601-1-8 standards.
4. Continuous real-time mathematical waveform synthesis engines generating clinical-grade physiological signals at standard medical sampling rates (250 Hz for ECG, 75 Hz for PPG, 25 Hz for Capnogram).

```
+----------------------------------------------------------------------------------------------------+
|                REAL-TIME MULTI-PARAMETER BEDSIDE TELEMETRY ARCHITECTURE                            |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ BEDSIDE SENSOR HARDWARE / IEEE 11073 ACQUISITION DAEMON ]                                       |
|  - 3/5-Lead ECG Bio-Potential Frontend (ADS1298 / ECG Lead II @ 250 - 500 Hz)                      |
|  - Dual-Wavelength Photoplethysmograph (Red 660nm / IR 940nm SpO2 @ 75 Hz)                         |
|  - Arterial Line Transducer / Oscillometric NIBP Module (mmHg)                                     |
|  - Infrared Microstream Capnometer & Thoracic Impedance Sensor (EtCO2 / RESP @ 25 Hz)               |
|  - Dual Precision Thermistor Probes (T1 Esophageal Core, T2 Peripheral Skin @ 1 Hz)                |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | REAL-TIME DSP SIGNAL PROCESSING & FEATURE EXTRACTION PIPELINE                                 | |
|  | - Digital Notch Filter (50/60 Hz Mains) & Bandpass Filter (0.05 - 150 Hz ECG, 0.5 - 5 Hz PPG)| |
|  | - Pan-Tompkins QRS Detection Algorithm & RR Interval Extraction                              | |
|  | - J-Point & ST-Segment Deviation Measurement (ST Elevation / Depression)                      | |
|  | - Corrected QT Calculation (Bazett QTc and Fridericia QTc)                                    | |
|  | - Mean Arterial Pressure (MAP) Integration & Delta-T Thermal Gradient Computation             | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  +-----------------------------------------------------------------------------------------------+ |
|  | ARRHYTHMIA TAXONOMY ENGINE & IEC 60601-1-8 ALARM STATE MACHINE                               | |
|  | - Asystole, V-Fib, V-Tach, Extreme Bradycardia (<40), Extreme Tachycardia (>160)             | |
|  | - PVC Bigeminy, Trigeminy, Couplets, R-on-T Ventricular Ectopy Warnings                       | |
|  | - Alarm Prioritization: RED (Flashing 2.0 Hz), YELLOW (Flashing 1.0 Hz), CYAN (Steady 0.5 Hz) | |
|  | - Strict 120-Second Alarm Silence Timeout with Mandatory Re-Alarm Trigger                     | |
|  +-----------------------------------------------------------------------------------------------+ |
|                               |                                                                    |
|                               v                                                                    |
|  [ WEBSOCKET / MQTT BROKER ]  -->  Central Nursing Station & Edge Bedside Client                  |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Physiological Telemetry Signal Metrics

### 2.1 Electrocardiogram (ECG Lead II)
Lead II (Right Arm to Left Leg vector) represents the standard clinical telemetry lead for rhythm and arrhythmia interpretation, aligned with the primary anatomical electrical axis of ventricular depolarization.

#### Standard Technical Constants:
- Sampling Frequency: $f_s = 250\text{ Hz}$ (telemetry standard) or $500\text{ Hz}$ (diagnostic standard)
- Voltage Calibration: $10\text{ mm} = 1.0\text{ mV}$
- Standard Display Sweep Speed: $25\text{ mm/s}$ (optional: $50\text{ mm/s}$)
- Bandwidth Filters: Diagnostic Mode ($0.05\text{ to } 150\text{ Hz}$), Monitor Mode ($0.5\text{ to } 40\text{ Hz}$), Surgical Filter Mode ($1.0\text{ to } 20\text{ Hz}$)

#### Quantitative ECG Metrics:
1. Heart Rate (HR in beats per minute, bpm):
   $$\text{HR} = \frac{60}{\text{RR}_{\text{mean}}}$$
   Derived from the rolling average of the preceding 8 to 12 detected R-R intervals in seconds. Normal adult resting range: $60\text{ to } 100\text{ bpm}$.
2. PR Interval (milliseconds, ms): Time elapsed from P-wave onset to QRS complex onset. Measures atrioventricular (AV) nodal conduction velocity. Normal range: $120\text{ to } 200\text{ ms}$. First-degree AV block if $\text{PR} > 200\text{ ms}$.
3. QRS Duration (milliseconds, ms): Time elapsed from Q-wave onset to S-wave termination (J-point). Measures ventricular depolarization time. Normal range: $60\text{ to } 100\text{ ms}$. Intraventricular conduction delay or Bundle Branch Block (BBB) if $\text{QRS} \ge 120\text{ ms}$.
4. QT Interval and Heart-Rate Corrected QT (QTc in milliseconds, ms): Time elapsed from Q-wave onset to T-wave termination at the isoelectric baseline. Measures total ventricular electrical depolarization and repolarization duration.
   - Bazett Correction Formula:
     $$\text{QTc}_{\text{Bazett}} = \frac{\text{QT}}{\sqrt{\text{RR}}}$$
     Where $\text{QT}$ and $\text{RR}$ are measured in seconds. Normal: $\le 440\text{ ms}$ (males), $\le 460\text{ ms}$ (females).
   - Fridericia Correction Formula (Clinically superior at elevated or depressed heart rates):
     $$\text{QTc}_{\text{Fridericia}} = \frac{\text{QT}}{\sqrt[3]{\text{RR}}}$$
   - Severe Prolongation Threshold: $\text{QTc} > 500\text{ ms}$ represents high risk for Torsades de Pointes polymorphic ventricular tachycardia.
5. ST-Segment Deviation (millimeters or millivolts): Voltage level difference between the isoelectric PR segment baseline and the ST segment measured at $J + 60\text{ ms}$ (for $\text{HR} > 100\text{ bpm}$) or $J + 80\text{ ms}$ (for $\text{HR} \le 100\text{ bpm}$).
   - $1.0\text{ mm} = 0.1\text{ mV}$.
   - Myocardial Ischemia Warning: ST Elevation $\ge +1.0\text{ mm}$ ($+0.1\text{ mV}$) or ST Depression $\le -1.0\text{ mm}$ ($-0.1\text{ mV}$) sustained across 3 consecutive beats.

---

### 2.2 Pulse Oximetry and Photoplethysmography (SpO2 / Pleth)

#### Signal Metrics:
1. Functional Arterial Oxygen Saturation ($\text{SpO}_2$ in percentage, %):
   Spectrophotometric ratio of oxygenated hemoglobin ($\text{HbO}_2$) to total functional hemoglobin ($\text{HbO}_2 + \text{Hb}$) derived from the dual-wavelength optical absorbance ratio $R$:
   $$R = \frac{(\text{AC}_{660} / \text{DC}_{660})}{(\text{AC}_{940} / \text{DC}_{940})}$$
   Where $\text{AC}_{660}$ and $\text{DC}_{660}$ are pulsatile and non-pulsatile components at Red $660\text{ nm}$, and $\text{AC}_{940}, \text{DC}_{940}$ are at Infrared $940\text{ nm}$.
   Standard calibration empirical curve:
   $$\text{SpO}_2 = 110 - 25 \times R$$
   Normal adult boundary: $95\%\text{ to } 100\%$. Hypoxemia threshold: $< 90\%$. Critical desaturation: $< 85\%$.
2. Perfusion Index (PI in percentage, %):
   Quantifies peripheral pulsatile signal strength at the sensor site:
   $$\text{PI} = \left( \frac{\text{AC}}{\text{DC}} \right) \times 100\%$$
   Clinical interpretation:
   - $\text{PI} < 0.4\%$: Extremely low peripheral perfusion (severe hypothermia, vasoconstriction, peripheral vascular disease, hypovolemic shock). Telemetry flags data as unreliable.
   - $\text{PI} = 0.4\%\text{ to } 5.0\%$: Moderate perfusion.
   - $\text{PI} > 5.0\%$: Robust peripheral perfusion and vasodilation.

---

### 2.3 Blood Pressure: Non-Invasive (NIBP) and Invasive Arterial Line (IBP)

#### Signal Metrics:
1. Systolic Blood Pressure (SBP in mmHg): Peak arterial pressure during left ventricular ejection. Normal: $90\text{ to } 120\text{ mmHg}$.
2. Diastolic Blood Pressure (DBP in mmHg): Trough arterial pressure during ventricular resting diastole. Normal: $60\text{ to } 80\text{ mmHg}$.
3. Pulse Pressure (PP in mmHg):
   $$\text{PP} = \text{SBP} - \text{DBP}$$
4. Mean Arterial Pressure (MAP in mmHg): The average perfusion pressure delivered to vital organ capillary beds across a complete cardiac cycle.
   - Non-Invasive Clinical Approximation Formula:
     $$\text{MAP}_{\text{NIBP}} = \frac{\text{SBP} + 2 \times \text{DBP}}{3} = \text{DBP} + \frac{1}{3}\text{PP}$$
     Rationale: Diastole occupies approximately two-thirds ($2/3$) of the standard cardiac cycle duration at resting heart rates.
   - Invasive Continuous Arterial Line Integration Formula:
     $$\text{MAP}_{\text{IBP}} = \frac{1}{T} \int_{0}^{T} P_{\text{art}}(t)\, dt$$
     Where $T$ is the cardiac cycle duration, and $P_{\text{art}}(t)$ is the continuous instantaneous pressure sampled at $100\text{ Hz}$.
   - Critical Organ Perfusion Target: $\text{MAP} \ge 65\text{ mmHg}$. $\text{MAP} < 65\text{ mmHg}$ risks acute tubular necrosis, myocardial ischemia, and cerebral hypoperfusion.

---

### 2.4 Respiration Rate (RESP) and End-Tidal Carbon Dioxide (EtCO2)

#### Signal Metrics:
1. Respiration Rate (RESP in respirations per minute, rpm):
   Derived from transthoracic electrical impedance plethysmography ($\Delta Z$) or capnogram respiratory cycle frequency ($\text{awRR}$). Normal resting adult rate: $12\text{ to } 20\text{ rpm}$. Tachypnea threshold: $> 30\text{ rpm}$. Bradypnea threshold: $< 8\text{ rpm}$.
2. End-Tidal Carbon Dioxide ($\text{EtCO}_2$ in mmHg or kPa):
   Partial pressure of carbon dioxide measured at the termination of clinical expiration (Point D of capnogram).
   - Normal physiological range: $35\text{ to } 45\text{ mmHg}$ ($4.7\text{ to } 6.0\text{ kPa}$).
   - Hypocapnia ($\text{EtCO}_2 < 30\text{ mmHg}$): Hyperventilation, massive pulmonary embolism, severe pulmonary hypoperfusion, cardiac arrest.
   - Hypercapnia ($\text{EtCO}_2 > 50\text{ mmHg}$): Hypoventilation, respiratory depression, acute airway obstruction, malignant hyperthermia.
3. Alveolar Slope and Angles:
   - Alpha Angle ($\alpha$): Angle between Phase II expiratory upstroke and Phase III alveolar plateau (normally $100^\circ\text{ to } 110^\circ$). Exceeds $130^\circ$ in obstructive pulmonary disease (asthma, COPD bronchospasm).
   - Beta Angle ($\beta$): Angle between Phase III alveolar plateau and Phase IV rapid inspiratory downstroke (normally approximately $90^\circ$). Exceeds $110^\circ$ during carbon dioxide rebreathing.

---

### 2.5 Dual-Channel Core and Peripheral Temperature (T1, T2, Delta T)

#### Signal Metrics:
1. Core Temperature ($T_1$ in degrees Celsius, $^\circ\text{C}$):
   Measured via esophageal thermistor, pulmonary artery catheter, or indwelling urinary catheter sensor. Normal physiological core range: $36.5^\circ\text{C to } 37.5^\circ\text{C}$.
2. Peripheral Skin Temperature ($T_2$ in degrees Celsius, $^\circ\text{C}$):
   Measured via skin surface disk probe affixed to the distal extremity (great toe or fingertip). Normal range: $31.0^\circ\text{C to } 34.0^\circ\text{C}$.
3. Thermal Gradient ($\Delta T$ in degrees Celsius, $^\circ\text{C}$):
   $$\Delta T = T_1 - T_2$$
   Clinical Perfusion Utility:
   - Normal physiological gradient: $\Delta T = 2.0^\circ\text{C to } 3.5^\circ\text{C}$.
   - Shock and Peripheral Vasoconstriction: In hypovolemic, cardiogenic, or septic shock with intense peripheral vasoconstriction, cutaneous blood flow drops dramatically, causing skin temperature to fall while core temperature remains elevated or spikes. A gradient of $\Delta T > 4.5^\circ\text{C to } 6.0^\circ\text{C}$ serves as an early indicator of peripheral circulatory failure.

---

## 3. Arrhythmia Classification Taxonomy and Decision Rules

The telemetry arrhythmia engine continuously classifies cardiac rhythm against explicit physiological criteria:

```
+----------------------------------------------------------------------------------------------------+
|                               MASTER ARRHYTHMIA CLASSIFICATION MATRIX                              |
+--------------------------+-----------------------+------------------------+------------------------+
| Arrhythmia Category      | IEC 60601-1-8 Alarm   | Quantitative Threshold | Motor / Audio Reaction |
+--------------------------+-----------------------+------------------------+------------------------+
| Asystole                 | RED (Immediate Death) | No QRS for > 4.00 sec  | Dual-Tone 2 Hz Flashing|
| Ventricular Fibrillation | RED (Immediate Death) | Chaotic Zero-Crossing  | Dual-Tone 2 Hz Flashing|
| Ventricular Tachycardia  | RED (Immediate Death) | Rate > 140, QRS > 120ms| Dual-Tone 2 Hz Flashing|
| Extreme Bradycardia      | RED (Critical Perfus.)| Sustained HR < 40 bpm  | Dual-Tone 2 Hz Flashing|
| Extreme Tachycardia      | RED (Critical Perfus.)| Sustained HR > 160 bpm | Dual-Tone 2 Hz Flashing|
| Apnea                    | RED (Respiratory Stop)| Zero breathing > 20 sec| Dual-Tone 2 Hz Flashing|
| PVC Bigeminy / Trigeminy | YELLOW (High Advisory)| Alternating 1:1 or 2:1 | Triple-Pulse 1 Hz Flash|
| ST Deviation Ischemia    | YELLOW (High Advisory)| |ST| >= 0.1mV (1.0mm)  | Triple-Pulse 1 Hz Flash|
| Technical Disconnect     | CYAN (Informational)  | Electrode / Probe Off  | Single Chime Steady Lt |
+--------------------------+-----------------------+------------------------+------------------------+
```

### 3.1 Decision Logic Specifications

1. `ASYSTOLE` (Red Alarm, Immediate Priority):
   - Criteria: Heart rate detected as $0\text{ bpm}$; no ventricular depolarization complex with peak amplitude $> 0.1\text{ mV}$ detected for an interval exceeding $T_{\text{pause}} \ge 4.00\text{ seconds}$.
2. `VENTRICULAR_FIBRILLATION` (Red Alarm, Immediate Priority):
   - Criteria: Disappearance of recognizable P, QRS, and T waveforms; baseline replaced by irregular, chaotic, undulating waveforms with variable amplitude ($> 0.1\text{ mV}$) and high zero-crossing frequency ($3.0\text{ to } 9.0\text{ Hz}$).
3. `VENTRICULAR_TACHYCARDIA` (Red Alarm, Immediate Priority):
   - Criteria: Sequence of $\ge 3$ consecutive wide ventricular ectopic beats ($\text{QRS duration} \ge 120\text{ ms}$) at a ventricular rate exceeding $140\text{ bpm}$. Sustained if duration $> 30\text{ seconds}$.
4. `EXTREME_BRADYCARDIA` (Red Alarm, Critical Hemodynamic Threat):
   - Criteria: Sustained average heart rate $\text{HR} < 40\text{ bpm}$ across an 8-beat rolling window in an adult patient.
5. `EXTREME_TACHYCARDIA` (Red Alarm, Critical Hemodynamic Threat):
   - Criteria: Sustained average heart rate $\text{HR} > 160\text{ bpm}$ across an 8-beat rolling window in an adult patient.
6. `APNEA` (Red Alarm, Respiratory Arrest):
   - Criteria: Cessation of cyclic thoracic impedance fluctuations or capnographic expiratory carbon dioxide bursts for a continuous elapsed duration $T_{\text{apnea}} \ge 20.00\text{ seconds}$.
7. `PVC_BIGEMINY` (Yellow Alarm, Medium Priority):
   - Criteria: Premature ventricular ectopic beats alternating with normal sinus beats in a repeated $1:1$ cadence (Sinus - PVC - Sinus - PVC) for $\ge 3$ consecutive pairs.
8. `PVC_TRIGEMINY` (Yellow Alarm, Medium Priority):
   - Criteria: A premature ventricular complex occurring after every two normal sinus beats in a repeated $2:1$ cadence (Sinus - Sinus - PVC) for $\ge 3$ consecutive cycles.
9. `ST_ELEVATION_DEPRESSION_ISCHEMIA` (Yellow Alarm, Medium Priority):
   - Criteria: Sustained displacement of the ST segment relative to the isoelectric PR baseline exceeding $|V_{\text{ST}}| \ge 0.10\text{ mV}$ ($1.0\text{ mm}$) in Lead II for $> 30\text{ seconds}$ without wide-QRS bundle branch aberration.
10. `PROBE_DISCONNECT_LEAD_OFF` (Cyan Alarm, Technical Low Priority):
    - Criteria: Common-mode high impedance ($> 100\text{ k}\Omega$) detected across Lead II electrode pairs (RA / LL), SpO2 optical sensor unplugged, or NIBP pneumatic cuff disconnected.

---

## 4. IEC 60601-1-8 Alarm System Protocol

The monitor alarm subsystem complies with IEC 60601-1-8 general requirements, tests, and guidance for alarm systems in medical electrical equipment:

### 4.1 Alarm Priority Stratification and Signaling

```
+----------------------------------------------------------------------------------------------------+
|                             IEC 60601-1-8 ALARM SIGNALING SPECIFICATIONS                           |
+-------------------+-----------------+-------------------+-------------------+----------------------+
| Alarm Priority    | Visual Indicator| Optical Flashing  | Auditory Sound    | Acoustic Burst       |
| Level             | Color Standard  | Frequency Standard| Pressure Level    | Pulse Sequence       |
+-------------------+-----------------+-------------------+-------------------+----------------------+
| HIGH_PRIORITY     | Flashing RED    | 2.0 Hz (Duty 50%) | 65 to 85 dBA      | 10-Pulse Dual-Burst  |
| MEDIUM_PRIORITY   | Flashing YELLOW | 1.0 Hz (Duty 50%) | 55 to 70 dBA      | 3-Pulse Single-Burst |
| LOW_PRIORITY      | Steady CYAN     | Constant ON       | 45 to 60 dBA      | 1 or 2 Intermittent  |
+-------------------+-----------------+-------------------+-------------------+----------------------+
```

1. High Priority (Red Alarm, Immediate Response Required):
   - Flashing frequency: Exactly $f = 2.0\text{ Hz}$ ($250\text{ ms}$ ON, $250\text{ ms}$ OFF).
   - Auditory pattern: 10-pulse burst composed of two 5-pulse groups:
     $$(\text{P}_1\text{--}\text{P}_2\text{--}\text{P}_3\text{--}\text{P}_4\text{--}\text{P}_5) \quad \text{inter-group pause } 400\text{ ms} \quad (\text{P}_6\text{--}\text{P}_7\text{--}\text{P}_8\text{--}\text{P}_9\text{--}\text{P}_{10})$$
     With pitch frequency $f_0 \approx 960\text{ Hz}$ and harmonic richness.
2. Medium Priority (Yellow Alarm, Prompt Awareness Required):
   - Flashing frequency: Exactly $f = 1.0\text{ Hz}$ ($500\text{ ms}$ ON, $500\text{ ms}$ OFF).
   - Auditory pattern: 3-pulse burst ($c\text{--}c\text{--}c$) repeated every $15\text{ to } 25\text{ seconds}$.
3. Low Priority (Cyan Technical Informational Alarm):
   - Visual: Steady Cyan / Light Blue illumination or slow flashing ($0.5\text{ Hz}$).
   - Auditory pattern: Single soft informational acoustic chime.

### 4.2 Alarm Silence and Mandatory Audio Re-Alarm Safety Invariant
1. Clinician Silence Action: When an attending nurse or doctor presses the Silence Alarm button, audible sound generation is immediately muted.
2. Visual Persistence: Visual flashing indicators (Red / Yellow text and LEDs) MUST continue flashing unimpeded as long as the physiological violation persists.
3. Silence Countdown Window: The silence window is hard-capped at a statutory maximum duration:
   $$T_{\text{silence\_max}} = 120.00\text{ seconds}$$
4. Mandatory Audio Re-Alarm Invariant:
   - A digital countdown timer ($120\text{s} \to 0\text{s}$) is displayed prominently on screen.
   - If the physiological violation has not resolved when the timer reaches $0\text{s}$, the monitor MUST automatically reinstate full acoustic alarm sound bursts at full volume.
   - Exception Escalation Rule: If a new alarm of higher priority occurs during the 120-second silence window (e.g., patient was silenced for Yellow Bradycardia but degenerates into Red Ventricular Fibrillation), the silence state is canceled immediately, and the high-priority alarm sounds instantly without delay.

---

## 5. Mathematical Waveform Synthesis Engines

For simulation, testing, training, and client-side visualization, the telemetry engine implements exact mathematical formulations to synthesize clinical-grade physiological signals.

### 5.1 Electrocardiogram (ECG Lead II) Synthesis

The cardiac cycle is modeled as an angular phase oscillator $\theta(t) \in [-\pi, \pi]$ with frequency $\omega = \frac{2\pi \cdot \text{HR}}{60}$:

$$\theta(t) = \left( \omega t \pmod{2\pi} \right) - \pi$$

The instantaneous voltage $V_{\text{ECG}}(\theta)$ in millivolts is synthesized as a linear superposition of 5 distinct Gaussian wave packets corresponding to the P, Q, R, S, and T waves, supplemented by baseline isoelectric offset and ST-segment deviation:

$$V_{\text{ECG}}(\theta) = \sum_{i \in \{P, Q, R, S, T\}} a_i \exp\left( -\frac{(\theta - \theta_i)^2}{2 b_i^2} \right) + V_{\text{ST}}(\theta)$$

#### Calibrated Parameter Matrix for Normal Adult Lead II:
| Wave Component | Clinical Meaning | Peak Amplitude $a_i$ (mV) | Width Parameter $b_i$ (rad) | Phase Center $\theta_i$ (rad) |
|---|---|---|---|---|
| P Wave | Atrial Depolarization | $+0.18\text{ mV}$ | $0.090\text{ rad}$ | $-1.20\text{ rad}$ |
| Q Wave | Septal Depolarization | $-0.15\text{ mV}$ | $0.035\text{ rad}$ | $-0.28\text{ rad}$ |
| R Wave | Ventricular Depolarization | $+1.45\text{ mV}$ | $0.050\text{ rad}$ | $0.00\text{ rad}$ |
| S Wave | Basal Ventricular Depolarization | $-0.35\text{ mV}$ | $0.045\text{ rad}$ | $+0.22\text{ rad}$ |
| T Wave | Ventricular Repolarization | $+0.35\text{ mV}$ | $0.220\text{ rad}$ | $+1.50\text{ rad}$ |

The ST deviation term $V_{\text{ST}}(\theta)$ is injected across the phase interval $[+0.25\text{ rad}, +1.20\text{ rad}]$ to model myocardial ischemia or injury:
$$V_{\text{ST}}(\theta) = \begin{cases}
\Delta V_{\text{ST}} \cdot \frac{1}{2}\left(1 - \cos\left( \frac{\pi(\theta - 0.25)}{0.95} \right)\right) & \text{if } 0.25 \le \theta \le 1.20 \\
0.0 & \text{otherwise}
\end{cases}$$
Where $\Delta V_{\text{ST}} \in [-0.5\text{ mV}, +0.5\text{ mV}]$.

---

### 5.2 Photoplethysmograph (PPG / Pleth) Waveform Synthesis

The peripheral arterial pulse waveform exhibits a rapid systolic upstroke, a systolic peak, a reflective downstroke, a distinct dicrotic notch resulting from aortic valve closure, and a diastolic runoff.

Given cardiac cycle phase $t' = (t \pmod T)$ where $T = \frac{60}{\text{HR}}$:
The normalized PPG amplitude $V_{\text{PPG}}(t') \in [0.0, 1.0]$ is synthesized via the dual-envelope Gaussian-exponential model:

$$V_{\text{PPG}}(t') = A_{\text{sys}} \cdot \left(\frac{t'}{\tau_{\text{up}}}\right)^2 \exp\left( 1 - \left(\frac{t'}{\tau_{\text{up}}}\right)^2 \right) + A_{\text{dic}} \exp\left( -\frac{(t' - t_{\text{dic}})^2}{2 \sigma_{\text{dic}}^2} \right)$$

#### Calibrated Parameter Values (at resting HR = 75 bpm, $T = 0.80\text{ s}$):
- Primary Systolic Amplitude: $A_{\text{sys}} = 0.85$
- Systolic Rise Time Constant: $\tau_{\text{up}} = 0.12\text{ s}$
- Dicrotic Notch Center Time: $t_{\text{dic}} = 0.32\text{ s}$
- Dicrotic Wave Amplitude: $A_{\text{dic}} = 0.28$
- Dicrotic Wave Width: $\sigma_{\text{dic}} = 0.05\text{ s}$

The sharp inflected dip preceding the secondary wave simulates the physiological dicrotic notch generated by transient reverse pressure gradients during aortic valve leaflet coaptation.

---

### 5.3 Capnogram Waveform Synthesis (EtCO2 Trapezoidal Model)

A normal clinical capnogram presents a characteristic four-phase rectangular-trapezoidal geometry across the respiratory cycle of period $T_{\text{resp}} = \frac{60}{\text{awRR}}$:

```
    CO2 (mmHg)
     50 |                                              Point D (EtCO2)
        |                                              /
     40 |                       +---------------------+
        |                      /   Phase III Alveolar |
     30 |                     /    Plateau            |
        |                    /                        |
     20 |                   /                         |
        |                  / Phase II                 | Phase IV
     10 |                 /  Expiratory               | Inspiratory
        |   Phase I      /   Upstroke                 | Downstroke
      0 +---------------+                             +-----------------
        0               t1   t2                       t3 t4             T_resp
                                Time in Respiratory Cycle (seconds)
```

The instantaneous partial pressure of carbon dioxide $P_{\text{CO}_2}(t') \in [0, \text{EtCO}_2]$ is computed as:

$$P_{\text{CO}_2}(t') = \begin{cases}
0.0 & \text{if } 0 \le t' < t_1 \quad (\text{Phase I: Anatomical dead space}) \\
\frac{\text{EtCO}_2 - \Delta P_{\text{plat}}}{2} \left( 1 - \cos\left( \pi \frac{t' - t_1}{t_2 - t_1} \right) \right) & \text{if } t_1 \le t' < t_2 \quad (\text{Phase II: Expiratory upstroke}) \\
(\text{EtCO}_2 - \Delta P_{\text{plat}}) + \Delta P_{\text{plat}} \left( \frac{t' - t_2}{t_3 - t_2} \right) & \text{if } t_2 \le t' < t_3 \quad (\text{Phase III: Alveolar plateau}) \\
\text{EtCO}_2 \exp\left( - \frac{t' - t_3}{\tau_{\text{insp}}} \right) & \text{if } t_3 \le t' < t_4 \quad (\text{Phase IV: Inspiratory downstroke}) \\
0.0 & \text{if } t_4 \le t' \le T_{\text{resp}} \quad (\text{Inspiratory baseline})
\end{cases}$$

#### Calibrated Parameter Values (at Respiratory Rate = 15 rpm, $T_{\text{resp}} = 4.00\text{ s}$, $\text{EtCO}_2 = 40.0\text{ mmHg}$):
- Dead Space End: $t_1 = 0.40\text{ s}$
- Alveolar Plateau Start: $t_2 = 0.90\text{ s}$
- Expiration End / Point D: $t_3 = 2.40\text{ s}$
- Alveolar Slope Differential: $\Delta P_{\text{plat}} = 4.0\text{ mmHg}$ (defines the slope of Phase III)
- Downstroke Time Constant: $\tau_{\text{insp}} = 0.08\text{ s}$
- Inspiration Reaches Baseline: $t_4 = 2.70\text{ s}$

---

## 6. TypeScript Production Interfaces and Telemetry Protocol

```typescript
export type AlarmPriority = 'HIGH_PRIORITY' | 'MEDIUM_PRIORITY' | 'LOW_PRIORITY' | 'NORMAL';

export type ArrhythmiaType =
  | 'NORMAL_SINUS_RHYTHM'
  | 'ASYSTOLE'
  | 'VENTRICULAR_FIBRILLATION'
  | 'VENTRICULAR_TACHYCARDIA'
  | 'EXTREME_BRADYCARDIA'
  | 'EXTREME_TACHYCARDIA'
  | 'PVC_BIGEMINY'
  | 'PVC_TRIGEMINY'
  | 'PVC_COUPLET'
  | 'ST_ELEVATION'
  | 'ST_DEPRESSION'
  | 'APNEA';

export interface VitalSignsTelemetryMetrics {
  timestamp: string;
  facilityCode: string;
  wardId: string;
  bedNumber: string;
  patientId: string;

  // 1. ECG Metrics (Lead II)
  heartRateBpm: number;
  prIntervalMs: number;
  qrsDurationMs: number;
  qtIntervalMs: number;
  qtcBazettMs: number;
  qtcFridericiaMs: number;
  stDeviationMm: number; // 1 mm = 0.1 mV

  // 2. Pulse Oximetry
  spO2Percentage: number;
  perfusionIndexPercent: number;

  // 3. Blood Pressure
  nibpSystolicMmHg: number;
  nibpDiastolicMmHg: number;
  nibpMeanArterialPressureMmHg: number;
  ibpSystolicMmHg?: number;
  ibpDiastolicMmHg?: number;
  ibpMeanArterialPressureMmHg?: number;

  // 4. Respiration & Capnography
  respirationRateRpm: number;
  etCo2MmHg: number;
  inspiredCo2MmHg: number;

  // 5. Dual Temperature
  temperatureCoreC: number; // T1
  temperaturePeripheralC: number; // T2
  temperatureDeltaC: number; // T1 - T2

  // Active Rhythm & Alarms
  primaryArrhythmia: ArrhythmiaType;
  activeAlarms: Array<{
    alarmCode: string;
    priority: AlarmPriority;
    messageKhmer: string;
    messageEnglish: string;
    triggeredAt: string;
    isSilenced: boolean;
    silenceRemainingSeconds: number;
  }>;
}

export interface WaveformSampleBatch {
  timestamp: string;
  bedNumber: string;
  samplingRates: {
    ecgHz: number; // 250
    ppgHz: number; // 75
    capnoHz: number; // 25
  };
  ecgLeadIIWaveformMillivolts: number[];
  ppgPlethWaveformNormalized: number[];
  capnogramWaveformMmHg: number[];
}
```

This specification establishes an IEEE 11073 and IEC 60601 compliant standard for bedside clinical physiological monitoring, mathematical waveform generation, arrhythmia detection, and prioritized alarm management.
