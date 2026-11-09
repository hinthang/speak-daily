/**
 * คำศัพท์ใหม่อัตโนมัติด้วย Gemini (ไม่มีวันหมด)
 * ลำดับการเพิ่มคำรายวัน: ใช้คลังใน WordBank.gs ก่อน → หมดแล้วให้ Gemini สร้างคำใหม่ให้ทุกวัน
 * สลับหัวข้อ: วันคู่ = ชีวิตประจำวัน, วันคี่ = สายงาน Data Engineer
 *
 * ตั้งค่า (ครั้งเดียว):
 *   1) สร้าง API key ฟรีที่ https://aistudio.google.com/apikey
 *   2) Apps Script > Project Settings (รูปเฟือง) > Script properties > Add property
 *        GEMINI_API_KEY = <key ที่ได้>
 *      (ไม่บังคับ) GEMINI_MODEL = ชื่อรุ่นที่อยากใช้ ถ้าไม่ใส่จะลองตามลำดับใน GEMINI_MODELS
 *   3) รัน testAutoWords() เพื่อลองสร้างคำ (แสดงผลใน Execution log ไม่บันทึกลงชีต)
 * ข้อมูลที่ส่งไป Gemini มีแค่หัวข้อและรายการคำภาษาอังกฤษที่มีอยู่แล้ว ไม่มีข้อมูลผู้ใช้
 */
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

const AUTO_TOPICS = {
  daily: [
    { cat: 'ทักทาย', lvl: '1 ประโยคสั้น', hint: 'small talk and polite everyday expressions' },
    { cat: 'อาหาร', lvl: '2 ชีวิตประจำวัน', hint: 'eating out, cooking, ordering food and drinks' },
    { cat: 'เดินทาง', lvl: '2 ชีวิตประจำวัน', hint: 'commuting, taxis, trains, airports, asking directions' },
    { cat: 'ช้อปปิ้ง', lvl: '2 ชีวิตประจำวัน', hint: 'shopping, prices, paying, returns, online orders' },
    { cat: 'บ้าน', lvl: '2 ชีวิตประจำวัน', hint: 'home, chores, family routines, repairs' },
    { cat: 'ความรู้สึก', lvl: '2 ชีวิตประจำวัน', hint: 'feelings, health, energy, mood in daily conversation' },
    { cat: 'เวลา', lvl: '2 ชีวิตประจำวัน', hint: 'making plans, schedules, appointments, weekends' },
    { cat: 'อากาศ', lvl: '2 ชีวิตประจำวัน', hint: 'weather, seasons, clothes for the weather' }
  ],
  work: [
    { cat: 'ที่ทำงาน', lvl: '3 ที่ทำงาน', hint: 'meetings, status updates, asking for help, deadlines' },
    { cat: 'ข้อมูลและเทค', lvl: '3 ที่ทำงาน', hint: 'ETL pipelines, scheduling jobs, failures, reruns, monitoring' },
    { cat: 'ข้อมูลและเทค', lvl: '3 ที่ทำงาน', hint: 'SQL, tables, joins, indexes, query performance, data quality' },
    { cat: 'ที่ทำงาน', lvl: '3 ที่ทำงาน', hint: 'work emails, chat messages, following up, giving feedback' },
    { cat: 'ข้อมูลและเทค', lvl: '3 ที่ทำงาน', hint: 'cloud data platforms like Databricks and Microsoft Fabric, storage, cost, security' },
    { cat: 'ข้อมูลและเทค', lvl: '3 ที่ทำงาน', hint: 'reports, dashboards, KPIs, explaining numbers to business users' },
    { cat: 'ที่ทำงาน', lvl: '4 สัมภาษณ์งาน', hint: 'job interviews for a data engineer: experience, strengths, projects' },
    { cat: 'ที่ทำงาน', lvl: '3 ที่ทำงาน', hint: 'working with clients and government agencies: requirements, sign-off, documents' }
  ]
};

function geminiKey_() { return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'); }

function todayTopic_() {
  const day = Math.floor(Date.now() / 864e5);
  const list = day % 2 ? AUTO_TOPICS.work : AUTO_TOPICS.daily;
  return list[Math.floor(day / 2) % list.length];
}

function callGemini_(prompt, schema) {
  const key = geminiKey_();
  if (!key) throw new Error('ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Script properties');
  const custom = PropertiesService.getScriptProperties().getProperty('GEMINI_MODEL');
  const models = custom ? [custom].concat(GEMINI_MODELS) : GEMINI_MODELS;
  const payload = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.9 }
  });
  let lastErr = '';
  for (const m of models) {
    const res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent', {
      method: 'post', contentType: 'application/json', payload: payload,
      headers: { 'x-goog-api-key': key }, muteHttpExceptions: true
    });
    const code = res.getResponseCode();
    if (code === 200) {
      const body = JSON.parse(res.getContentText());
      const text = body.candidates && body.candidates[0] && body.candidates[0].content.parts.map(p => p.text || '').join('');
      if (text) return JSON.parse(text);
      lastErr = m + ': ไม่มีข้อความตอบกลับ';
      continue;
    }
    lastErr = m + ': HTTP ' + code + ' ' + res.getContentText().slice(0, 200);
    if (code === 400 && /API key/i.test(res.getContentText())) break;   // key ผิด ไม่ต้องลองรุ่นอื่น
    if (code === 429) break;                                               // เกินโควตาวันนี้
  }
  throw new Error('เรียก Gemini ไม่สำเร็จ: ' + lastErr);
}

const S_ = (props, req) => ({ type: 'OBJECT', properties: props, required: req || Object.keys(props) });
const STR_ = { type: 'STRING' };

// สร้างคำ/ประโยค/บทสนทนาใหม่ (ยังไม่บันทึก) — คืน {topic, words[][5], sentences[][5], dialog[]}
function generateWords_(nWords, nSents) {
  const topic = todayTopic_();
  const have = readTable_(SHEET_VOCAB).map(r => String(r[0]).toLowerCase());
  const haveSet = new Set(have);
  const haveS = new Set(readTable_(SHEET_SENT).map(r => String(r[0]).toLowerCase()));

  const prompt = [
    'You write English practice material for a Thai adult (a Senior Data Engineer in Bangkok) who is learning to SPEAK English.',
    'Topic for today: ' + topic.hint + '.',
    'Return JSON only, following the schema.',
    '',
    'words: exactly ' + (nWords + 3) + ' high-frequency, practical English words or short phrases for this topic that people really say.',
    'Do NOT use any of these existing words: ' + have.slice(-400).join(', ') + '.',
    '  en: the English word/phrase (lowercase unless a proper noun).',
    '  rd: Thai-script pronunciation of how it is actually spoken in American English. Join syllables with "-" and separate words with one space.',
    '      Examples: meeting → มี-ดิ้ง, data → เด-ด้า, thank you → แธง-คิว, schedule → สเก็จ-จูล, problem → พรา-เบลิ้ม.',
    '  th: short natural Thai meaning.',
    '  tip: one short Thai tip about a mistake Thai speakers often make with this word (stress, th, final sounds, silent letters). Empty string if none.',
    '  emoji: ONE emoji that best pictures the word (an object, action, person or feeling). For abstract words pick the closest symbol, e.g. deadline → ⏰, query → 🔎.',
    '',
    'sentences: exactly ' + (nSents + 1) + ' natural spoken sentences of 4 to 9 words that use the new words. Mix forms: affirmative, negative, question, past, future.',
    '  en: the sentence with normal punctuation.',
    '  rd: Thai-script pronunciation for EACH English word, separated by single spaces. The number of space-separated chunks MUST equal the number of English words.',
    '      Use "-" inside a chunk for syllables. Reflect connected speech, e.g. "want to" → "วอน นะ", "could you" → "คุด จู", "to" → "ทะ".',
    '  th: Thai meaning.  tip: one short Thai tip about linking or stress in this sentence, or empty string.',
    '',
    'dialog: one short question and a natural answer about the topic. qr and ar follow the same rd rule (one chunk per English word).'
  ].join('\n');

  const schema = S_({
    words: { type: 'ARRAY', items: S_({ en: STR_, rd: STR_, th: STR_, tip: STR_, emoji: STR_ }) },
    sentences: { type: 'ARRAY', items: S_({ en: STR_, rd: STR_, th: STR_, tip: STR_ }) },
    dialog: S_({ q: STR_, qr: STR_, qt: STR_, a: STR_, ar: STR_, at: STR_ })
  });
  const out = callGemini_(prompt, schema);

  const thai = s => /[฀-๿]/.test(s || '');
  const sameCount = (en, rd) => String(en).trim().split(/\s+/).length === String(rd).trim().split(/\s+/).length;
  const words = (out.words || [])
    .filter(w => w && /^[a-z][a-z' .-]{0,40}$/i.test(String(w.en).trim()) && thai(w.rd) && thai(w.th))
    .filter(w => { const k = String(w.en).trim().toLowerCase(); if (haveSet.has(k)) return false; haveSet.add(k); return true; })
    .slice(0, nWords)
    .map(w => [String(w.en).trim(), String(w.rd).trim(), String(w.th).trim(), topic.cat, String(w.tip || '').trim(), String(w.emoji || '').trim().slice(0, 16)]);
  const sentences = (out.sentences || [])
    .filter(s => s && s.en && thai(s.rd) && thai(s.th) && sameCount(s.en, s.rd) && !haveS.has(String(s.en).trim().toLowerCase()))
    .slice(0, nSents)
    .map(s => [String(s.en).trim(), String(s.rd).trim().replace(/\s+/g, ' '), String(s.th).trim(), topic.lvl, String(s.tip || '').trim()]);
  const d = out.dialog;
  const dialog = d && thai(d.qr) && thai(d.ar) && sameCount(d.q, d.qr) && sameCount(d.a, d.ar)
    ? [d.q, d.qr, d.qt, d.a, d.ar, d.at, topic.cat].map(x => String(x).trim()) : null;
  return { topic: topic.hint, words: words, sentences: sentences, dialog: dialog };
}

// บันทึกผลจาก Gemini ลงชีต
function saveGenerated_(g) {
  const ss = getSS_();
  if (g.words.length) { ensureEmojiCol_(); const sh = ss.getSheetByName(SHEET_VOCAB); sh.getRange(sh.getLastRow() + 1, 1, g.words.length, 6).setValues(g.words); }
  if (g.sentences.length) { const sh = ss.getSheetByName(SHEET_SENT); sh.getRange(sh.getLastRow() + 1, 1, g.sentences.length, 5).setValues(g.sentences); }
  if (g.dialog) {
    const sh = ensureSheet_(ss, SHEET_DLG, ['question', 'q_reading', 'q_thai', 'answer', 'a_reading', 'a_thai', 'topic'], SEED_DIALOG);
    sh.appendRow(g.dialog);
  }
}

// รันเองเพื่อทดสอบ key (ไม่บันทึกลงชีต)
function testAutoWords() {
  const g = generateWords_(3, 2);
  Logger.log('หัวข้อ: ' + g.topic);
  Logger.log(JSON.stringify(g, null, 2));
}
