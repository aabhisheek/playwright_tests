// AI form-filling engine for Playwright.
//
// Flow:  extract fields  ->  reuse from JSON memory  ->  ask Claude for the rest
//        ->  fill the form  ->  save new answers back to memory.
//
// Works on a Page OR a Frame (e.g. LinkedIn's iframe contentFrame()), so pass
// whichever "scope" the form actually lives in.
//
// Requires:  process.env.ANTHROPIC_API_KEY   (only when there are unknown fields)
// Optional:  process.env.AIFF_MODEL          (default: claude-haiku-4-5-20251001)
//
// Quick use:
//   import { autoFill } from './lib/aiFormFiller.js';
//   import profile from './data/profile.json' assert { type: 'json' };
//   await autoFill(frame, { profile, jobContext: 'Backend Engineer @ Acme' });

import fs from 'fs';
import path from 'path';

const MEMORY_PATH = path.join(process.cwd(), 'tests', 'data', 'answerMemory.json');

const MODEL = process.env.AIFF_MODEL || 'claude-haiku-4-5-20251001';
const API_URL = 'https://api.anthropic.com/v1/messages';

// ---------------------------------------------------------------------------
// Memory layer (plain JSON file: { "normalized question": "answer" })
// ---------------------------------------------------------------------------

function normalizeKey(label) {
  return String(label || '')
    .toLowerCase()
    .replace(/\*+/g, '')        // drop required markers
    .replace(/[?:.]/g, '')      // drop trailing punctuation
    .replace(/\s+/g, ' ')       // collapse whitespace
    .trim();
}

export function loadMemory() {
  try {
    return JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'));
  } catch {
    return {};
  }
}

export function saveMemory(memory) {
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2) + '\n', 'utf8');
}

function recall(memory, label) {
  return memory[normalizeKey(label)];
}

function remember(memory, label, answer) {
  if (answer != null && answer !== '') memory[normalizeKey(label)] = answer;
}

// ---------------------------------------------------------------------------
// 1. Extract every fillable field on the page/frame
//    We stamp each field with data-aiff-id so we can locate it again to fill.
// ---------------------------------------------------------------------------

export async function extractFields(scope) {
  return await scope.evaluate(() => {
    const out = [];
    let counter = 0;
    const seenRadioGroups = new Set();
    const skip = ['hidden', 'submit', 'button', 'image', 'reset'];

    const labelFor = (node) => {
      if (node.labels && node.labels[0]) return node.labels[0].innerText.trim();
      const aria = node.getAttribute('aria-label');
      if (aria) return aria.trim();
      const by = node.getAttribute('aria-labelledby');
      if (by) {
        const l = document.getElementById(by);
        if (l) return l.innerText.trim();
      }
      const fieldset = node.closest('fieldset');
      if (fieldset) {
        const legend = fieldset.querySelector('legend');
        if (legend) return legend.innerText.trim();
      }
      if (node.placeholder) return node.placeholder.trim();
      return '';
    };

    document.querySelectorAll('input, textarea, select').forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const type = tag === 'select' ? 'select' : (el.type || tag).toLowerCase();
      if (skip.includes(type)) return;

      // Radios: collapse the whole group into one logical field.
      if (type === 'radio') {
        const name = el.name;
        if (name && seenRadioGroups.has(name)) return;
        if (name) seenRadioGroups.add(name);
        const groupId = 'aiff-' + counter++;
        const group = name
          ? document.querySelectorAll(`input[type=radio][name="${CSS.escape(name)}"]`)
          : [el];
        const options = [];
        group.forEach((r, i) => {
          const rid = groupId + '-' + i;
          r.setAttribute('data-aiff-id', rid);
          let lbl = '';
          if (r.labels && r.labels[0]) lbl = r.labels[0].innerText.trim();
          else if (r.getAttribute('aria-label')) lbl = r.getAttribute('aria-label').trim();
          options.push({ value: r.value, label: lbl || r.value, radioId: rid });
        });
        out.push({ aiffId: groupId, type: 'radio', label: labelFor(el), required: el.required, options });
        return;
      }

      const id = 'aiff-' + counter++;
      el.setAttribute('data-aiff-id', id);
      const field = { aiffId: id, type, label: labelFor(el), required: el.required, value: el.value };
      if (type === 'select') {
        field.options = Array.from(el.options)
          .map((o) => ({ value: o.value, label: o.text.trim() }))
          .filter((o) => o.label);
      }
      out.push(field);
    });

    return out;
  });
}

// ---------------------------------------------------------------------------
// 2. Ask Claude for answers to the fields we don't already know
// ---------------------------------------------------------------------------

export async function askClaude(fields, { profile, jobContext } = {}) {
  if (!fields.length) return [];
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set, but the form has fields with no saved answer. ' +
        'Set the key, or pre-seed tests/data/answerMemory.json.'
    );
  }

  // Trim the field list to what the model needs to decide an answer.
  const ask = fields.map((f) => ({
    label: f.label,
    type: f.type,
    ...(f.options ? { options: f.options.map((o) => o.label) } : {}),
  }));

  const system =
    'You fill out job-application forms on behalf of a candidate. ' +
    'Answer every field concisely and realistically using the candidate profile. ' +
    'Rules: for "years of experience" questions answer with a plain number; ' +
    'for yes/no or any field that lists options, the answer MUST be exactly one of the given option labels; ' +
    'for free text keep it short and professional. ' +
    'Return ONLY a JSON array of objects {"label": <string>, "answer": <string>} with one entry per field. No prose.';

  const user =
    `Candidate profile:\n${JSON.stringify(profile || {}, null, 2)}\n\n` +
    (jobContext ? `Job context: ${jobContext}\n\n` : '') +
    `Fields to answer:\n${JSON.stringify(ask, null, 2)}`;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Claude API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = (data.content || []).map((c) => c.text || '').join('');
  return parseAnswers(text);
}

function parseAnswers(text) {
  // Be tolerant of code fences / stray prose around the JSON array.
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 3. Fill the form using the stamped data-aiff-id locators
// ---------------------------------------------------------------------------

function bestOption(options, answer) {
  const a = normalizeKey(answer);
  return (
    options.find((o) => normalizeKey(o.label) === a || normalizeKey(o.value) === a) ||
    options.find((o) => normalizeKey(o.label).includes(a) || a.includes(normalizeKey(o.label))) ||
    null
  );
}

export async function fillFields(scope, fields, answers) {
  const byLabel = new Map(answers.map((a) => [normalizeKey(a.label), a.answer]));

  for (const f of fields) {
    const ans = byLabel.get(normalizeKey(f.label));
    if (ans == null || ans === '') continue;

    try {
      if (f.type === 'radio') {
        const opt = bestOption(f.options, ans);
        if (opt) await scope.locator(`[data-aiff-id="${opt.radioId}"]`).check({ force: true });
      } else if (f.type === 'select') {
        const loc = scope.locator(`[data-aiff-id="${f.aiffId}"]`);
        const opt = bestOption(f.options, ans);
        if (opt) {
          await loc.selectOption({ value: opt.value }).catch(() => loc.selectOption({ label: opt.label }));
        }
      } else if (f.type === 'checkbox') {
        const loc = scope.locator(`[data-aiff-id="${f.aiffId}"]`);
        if (/^(yes|true|1|on|checked)$/i.test(String(ans))) await loc.check({ force: true });
      } else {
        await scope.locator(`[data-aiff-id="${f.aiffId}"]`).fill(String(ans));
      }
    } catch (e) {
      // Don't abort the whole form for one stubborn field.
      console.warn(`[aiFormFiller] could not fill "${f.label}": ${e.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Orchestrator: extract -> recall -> ask -> fill -> save
// ---------------------------------------------------------------------------

export async function autoFill(scope, { profile, jobContext } = {}) {
  const memory = loadMemory();
  const fields = await extractFields(scope);
  if (!fields.length) return [];

  const answers = [];
  const unknown = [];

  for (const f of fields) {
    const known = recall(memory, f.label);
    if (known != null) answers.push({ label: f.label, answer: known });
    else unknown.push(f);
  }

  if (unknown.length) {
    const fresh = await askClaude(unknown, { profile, jobContext });
    for (const a of fresh) {
      remember(memory, a.label, a.answer);
      answers.push(a);
    }
    saveMemory(memory);
  }

  await fillFields(scope, fields, answers);
  return answers;
}
