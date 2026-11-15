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
 * Generate intelligent clinical triage response for standard allowed patient queries
 */
function generateStandardClinicalResponse(text) {
  const lower = (text || '').toLowerCase();

  // Cognitive / Neurological / Fatigue (Brainfog, Headache, Dizziness)
  if (lower.includes('brainfog') || lower.includes('brain fog') || lower.includes('headache') || lower.includes('sar dard') || lower.includes('chakkar') || lower.includes('dizziness') || lower.includes('memory') || lower.includes('forgetful') || lower.includes('fatigue')) {
    return 'Brain fog aur zehni thakawat aksar sleep disturbances, chronic mental stress, dehydration, nutritional deficiencies (Vitamin B12/Vitamin D), ya neurological factors ki wajah se ho sakti hai. Hamari tajweez hai ke aap hamare Neurologist (Dr. Hamza Ali) ya General Physician (Dr. Muhammad Tariq) se comprehensive clinical consultation lein. Kya aap consultation appointment book karna chahte hain?';
  }

  // Orthopedics / Musculoskeletal / Joint Pain
  if (lower.includes('back pain') || lower.includes('kamar dard') || lower.includes('joint') || lower.includes('ghutne') || lower.includes('bone') || lower.includes('fracture') || lower.includes('muscle')) {
    return 'Musculoskeletal aur joint pain ke liye hamare Orthopedic Surgeon (Dr. Usman Farooq) Tuesday, Thursday aur Saturday ko dastiyab hain. Detailed examination aur physical assessment ke liye appointment book kar sakte hain.';
  }

  // Dermatology / Skin / Hair
  if (lower.includes('skin') || lower.includes('rash') || lower.includes('kharish') || lower.includes('acne') || lower.includes('hair') || lower.includes('daag')) {
    return 'Jild aur baalon ke masail ke liye hamari Consultant Dermatologist (Dr. Fatima Zahra) Monday, Tuesday, Thursday aur Friday ko available hain. OPD consulting hours 11:00 AM se 06:00 PM hain.';
  }

  // Pediatrics / Child Health
  if (lower.includes('child') || lower.includes('bacha') || lower.includes('baby') || lower.includes('infant') || lower.includes('vaccin')) {
    return 'Bachon ki bimariyon aur immunization ke liye hamare Pediatrician (Dr. Bilal Ahmed) subah 09:00 AM se 01:00 PM tak dastiyab hain.';
  }

  // ENT / Ear / Nose / Throat
  if (lower.includes('ear') || lower.includes('kan') || lower.includes('throat') || lower.includes('gala') || lower.includes('nose') || lower.includes('naak')) {
    return 'Kaan, naak aur gale ke masail ke liye ENT Specialist (Dr. Zainab Malik) Monday, Wednesday aur Friday ko clinical consultation ke liye available hain.';
  }

  // Cardiology / Heart / BP
  if (lower.includes('heart') || lower.includes('blood pressure') || lower.includes('bp') || lower.includes('cardio') || lower.includes('dil')) {
    return 'Cardiovascular evaluation aur hypertension control ke liye hamare Cardiologist (Dr. Ayesha Khan / Dr. Babar Azam) available hain. Agar aapko koi chest discomfort ya shortness of breath mehsoos ho to foran emergency casualty tashreef layein.';
  }

  // Appointments / Booking
  if (lower.includes('appointment') || lower.includes('booking') || lower.includes('timing') || lower.includes('slot')) {
    return 'MediPulse AI automated scheduling desk active hai. Aap Appointments tab se kisi bhi specialist doctor ki consultation timing dekh kar apna slot reserve kar sakte hain.';
  }

  // Reports
  if (lower.includes('report') || lower.includes('test') || lower.includes('cbc') || lower.includes('lab')) {
    return 'Diagnostic lab reports ke liye hamara cryptographic verification portal 24/7 dastiyab hai. Secure token enter kar ke aap direct PDF report access kar sakte hain.';
  }

  // General Medical / Concierge
  return 'Assalam-o-Alaikum! MediPulse AI clinical triage concierge aapki khidmat mein hazir hai. Hum aapke symptoms ki roshni mein mutaliqa specialist doctor recommend kar sakte hain aur appointment schedule karne mein madad faraham karte hain. Aap apna masla ya sawal tafseel se bata sakte hain.';
}

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
        reply: 'Aapka message security guidelines ke anusaar process nahi kiya ja sakta. Kripya hospital services se related sawaal poochhein.',
        aiResponse: 'Aapka message security guidelines ke anusaar process nahi kiya ja sakta. Kripya hospital services se related sawaal poochhein.',
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

      const emergencyReply = '⚠️ YEH EK MEDICAL EMERGENCY HO SAKTI HAI.\n\nKripya turant nazdeeki Emergency Room / Casualty jaayein ya Ambulance (108 / 112) ko call karein.\n\nHamari emergency team ko alert bhej diya gaya hai.';
      return {
        safe: false,
        isEmergency: true,
        blocked: false,
        reason: 'MEDICAL_EMERGENCY_DETECTED',
        response: emergencyReply,
        reply: emergencyReply,
        aiResponse: emergencyReply,
      };
    }
  }

  // 3. Clinical Advice / Prescription boundary
  for (const keyword of CLINICAL_DIAGNOSIS_KEYWORDS) {
    if (lower.includes(keyword)) {
      const boundaryReply = 'AI assistant dawai prescribe nahi kar sakta aur na hi bimari diagnose kar sakta hai. Kripya hamare doctor se direct paramarsh lein. Kya aap kisi specific doctor ke saath appointment book karna chahte hain?';
      return {
        safe: true,
        isSafe: true,
        isEmergency: false,
        blocked: false,
        isClinicalDiagnosis: true,
        clinicalBoundaryTriggered: true,
        action: 'CLINICAL_BOUNDARY',
        reason: 'CLINICAL_ADVICE_DISCLAIMER',
        response: boundaryReply,
        reply: boundaryReply,
        aiResponse: boundaryReply,
      };
    }
  }

  const standardReply = generateStandardClinicalResponse(text);
  return {
    safe: true,
    isSafe: true,
    isEmergency: false,
    blocked: false,
    isClinicalDiagnosis: false,
    isPromptInjection: false,
    action: 'ALLOW',
    response: standardReply,
    reply: standardReply,
    aiResponse: standardReply,
  };
}

async function screenMessage(text, patientPhone = '') {
  const res = await screenIncomingMessage(text, patientPhone);
  if (res.reason === 'MEDICAL_EMERGENCY_DETECTED') {
    res.action = 'EMERGENCY_ESCALATE';
    res.hotline = '108 / 112';
    res.reply = res.response;
    res.aiResponse = res.response;
  } else if (res.reason === 'PROMPT_INJECTION_BLOCKED') {
    res.action = 'SECURITY_BLOCK';
    res.isPromptInjection = true;
    res.reply = res.response;
    res.aiResponse = res.response;
  } else {
    res.aiResponse = res.response || res.reply;
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
