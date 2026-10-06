import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

export function calculateBmi(weightKg: number, heightCm: number): { bmi: number; category: string } {
  if (weightKg <= 0 || heightCm <= 0) {
    throw new Error('Weight and height must be positive numbers');
  }
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  let category = 'Normal';
  if (bmi < 18.5) {
    category = 'Underweight';
  } else if (bmi < 25.0) {
    category = 'Normal';
  } else if (bmi < 30.0) {
    category = 'Overweight';
  } else {
    category = 'Obese';
  }

  return { bmi, category };
}

export function evaluateBloodPressure(systolic: number, diastolic: number): string {
  if (systolic < 120 && diastolic < 80) return 'Normal';
  if (systolic <= 129 && diastolic < 80) return 'Elevated';
  if (systolic <= 139 || diastolic <= 89) return 'Stage 1 Hypertension';
  return 'Stage 2 Hypertension';
}

describe('Clinical Vitals & Measurements Test Suite', () => {
  it('should accurately calculate BMI and assign clinical categories', () => {
    // Normal: 70kg, 175cm -> 22.9
    const res1 = calculateBmi(70, 175);
    assert.equal(res1.bmi, 22.9);
    assert.equal(res1.category, 'Normal');

    // Underweight: 45kg, 170cm -> 15.6
    const res2 = calculateBmi(45, 170);
    assert.equal(res2.bmi, 15.6);
    assert.equal(res2.category, 'Underweight');

    // Overweight: 80kg, 170cm -> 27.7
    const res3 = calculateBmi(80, 170);
    assert.equal(res3.bmi, 27.7);
    assert.equal(res3.category, 'Overweight');

    // Obese: 100kg, 170cm -> 34.6
    const res4 = calculateBmi(100, 170);
    assert.equal(res4.bmi, 34.6);
    assert.equal(res4.category, 'Obese');
  });

  it('should reject invalid zero or negative measurements', () => {
    assert.throws(() => calculateBmi(-5, 170), /positive numbers/);
    assert.throws(() => calculateBmi(70, 0), /positive numbers/);
  });

  it('should correctly classify blood pressure readings according to medical standards', () => {
    assert.equal(evaluateBloodPressure(115, 75), 'Normal');
    assert.equal(evaluateBloodPressure(125, 78), 'Elevated');
    assert.equal(evaluateBloodPressure(135, 85), 'Stage 1 Hypertension');
    assert.equal(evaluateBloodPressure(150, 95), 'Stage 2 Hypertension');
  });
});
