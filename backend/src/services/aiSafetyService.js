// src/services/aiSafetyService.js — Clinical Boundaries & AI Guardrails
'use strict';

const db = require('../db/dbAdapter');

const EMERGENCY_KEYWORDS = [
  'chest pain',
  'seene me dard',
  'heart attack',
  'severe bleeding',
  'khoon beh raha',
  'difficulty breathing',
  'saans nahi aa rahi',
  'unconscious',
  'behoshi',
  'stroke',
  'paralysis',
  'poison',
  'zeher',
  'suicide',
  'anaphylaxis',
  'severe allergic reaction',
];

const CLINICAL_DIAGNOSIS_KEYWORDS = [
  'prescribe',
  'dawai likh do',
  'what medicine should i take',
  'kaunsi dawai loon',
  'do i have cancer',
  'kya mujhe bimari hai',
  'dosage for',
  'antibiotic name',
];

const PROMPT_INJECTION_KEYWORDS = [
  'ignore previous instructions',
  'system prompt',
  'reveal secret',
  'show api key',
  'drop table',
  'select * from',
  'bypass filter',
];

/**
 * Screen input message against medical guardrails
 */
async function screenIncomingMessage(text, patientPhone = '') {
  const lower = (text || '').toLowerCase();

  // 1. Prompt injection screening
  for (const pattern of PROMPT_INJECTION_KEYWORDS) {
    if (lower.includes(pattern)) {
      return {
        safe: false,
        isEmergency: false,
        blocked: true,
        reason: 'PROMPT_INJECTION_BLOCKED',
        response: 'Aapka message security guidelines ke anusaar process nahi kiya ja sakta. Kripya hospital services se related sawaal poochhein.',
      };
    }
  }

  // 2. Immediate Emergency screening
  for (const keyword of EMERGENCY_KEYWORDS) {
    if (lower.includes(keyword)) {
      // Record emergency escalation
      if (patientPhone) {
        await db.from('escalations').insert({
          patient_phone: patientPhone,
          reason: `EMERGENCY ALERT detected in incoming message: "${text.slice(0, 150)}"`,
          urgency: 'emergency',
          resolved: false,
          created_at: new Date().toISOString(),
        });
      }

      return {
        safe: false,
        isEmergency: true,
        blocked: false,
        reason: 'MEDICAL_EMERGENCY_DETECTED',
        response: '⚠️ YEH EK MEDICAL EMERGENCY HO SAKTI HAI.\n\nKripya turant nazdeeki Emergency Room / Casualty jaayein ya Ambulance (108 / 112) ko call karein.\n\nHamari emergency team ko alert bhej diya gaya hai.',
      };
    }
  }

  // 3. Clinical Advice / Prescription boundary
  for (const keyword of CLINICAL_DIAGNOSIS_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        safe: true,
        isSafe: true,
        isEmergency: false,
        blocked: false,
        isClinicalDiagnosis: true,
        clinicalBoundaryTriggered: true,
        action: 'CLINICAL_BOUNDARY',
        reason: 'CLINICAL_ADVICE_DISCLAIMER',
        response: 'AI assistant dawai prescribe nahi kar sakta aur na hi bimari diagnose kar sakta hai. Kripya hamare doctor se direct paramarsh lein. Kya aap kisi specific doctor ke saath appointment book karna chahte hain?',
        reply: 'AI assistant dawai prescribe nahi kar sakta aur na hi bimari diagnose kar sakta hai. Kripya hamare doctor se direct paramarsh lein. Kya aap kisi specific doctor ke saath appointment book karna chahte hain?',
      };
    }
  }

  return {
    safe: true,
    isSafe: true,
    isEmergency: false,
    blocked: false,
    isClinicalDiagnosis: false,
    isPromptInjection: false,
    action: 'ALLOW',
  };
}

async function screenMessage(text, patientPhone = '') {
  const res = await screenIncomingMessage(text, patientPhone);
  if (res.reason === 'MEDICAL_EMERGENCY_DETECTED') {
    res.action = 'EMERGENCY_ESCALATE';
    res.hotline = '108 / 112';
    res.reply = res.response;
  } else if (res.reason === 'PROMPT_INJECTION_BLOCKED') {
    res.action = 'SECURITY_BLOCK';
    res.isPromptInjection = true;
    res.reply = res.response;
  }
  return res;
}

module.exports = {
  screenIncomingMessage,
  screenMessage,
  EMERGENCY_KEYWORDS,
  CLINICAL_DIAGNOSIS_KEYWORDS,
  PROMPT_INJECTION_KEYWORDS,
};
