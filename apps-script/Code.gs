/**
 * พูดอังกฤษทุกวัน — Google Apps Script Web App
 * ไฟล์: Code.gs + Index.html
 *
 * วิธีติดตั้ง
 * 1) script.google.com > New project แล้ววางไฟล์นี้เป็น Code.gs
 * 2) File > New > HTML ตั้งชื่อ "Index" แล้ววาง Index.html
 * 3) รันฟังก์ชัน setup() ครั้งแรก 1 ครั้ง (อนุญาตสิทธิ์) ระบบจะสร้าง Google Sheet พร้อมข้อมูลตั้งต้น
 * 4) Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone
 *    (ทุกคนที่มีลิงก์เข้าได้ แต่ต้องสมัคร/เข้าสู่ระบบด้วยชื่อผู้ใช้ + PIN ก่อนใช้งาน)
 *
 * เพิ่มคำศัพท์ใหม่ได้ใน Sheet "Vocab"  (english | reading | thai | category)
 * เพิ่มประโยคได้ใน Sheet "Sentences"     (english | reading | thai | level)
 *   - คอลัมน์ reading ของประโยค: เขียนคำอ่านทีละคำ คั่นด้วยเว้นวรรค ให้จำนวนเท่ากับคำภาษาอังกฤษ
 *     (ถ้าคำอ่านมีหลายพยางค์ให้ใช้ - เชื่อม ห้ามเว้นวรรค) เช่น  I need more time  →  ไอ นีด มอร์ ไทม์
 */

const SHEET_VOCAB = 'Vocab';
const SHEET_SENT = 'Sentences';
const SHEET_PROG = 'Progress';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('พูดอังกฤษทุกวัน')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- API สำหรับหน้าเว็บที่โฮสต์ภายนอก (เช่น GitHub Pages) ----------
 * หน้าเว็บส่ง POST (Content-Type: text/plain) เป็น {"fn": "ชื่อฟังก์ชัน", "args": [...]}
 * เรียกได้เฉพาะฟังก์ชันในรายการด้านล่าง · ตอบกลับ {"ok": true, "result": ...} หรือ {"ok": false, "error": "..."}
 * ต้อง Deploy เป็น Web app: Execute as = Me, Who has access = Anyone
 */
const API_FUNCS = {
  register: register, login: login, me: me, logout: logout, leaderboard: leaderboard,
  getRandomSet: getRandomSet, markLearned: markLearned, getAllForQuiz: getAllForQuiz, getDialogs: getDialogs,
  addFromBank: addFromBank, addWord: addWord,
  getLessons: getLessons, submitLesson: submitLesson,
  getReviewSet: getReviewSet, reviewResult: reviewResult
};

function doPost(e) {
  let out;
  try {
    const req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const fn = API_FUNCS[req.fn];
    if (!fn) throw new Error('ไม่รู้จักคำสั่ง ' + req.fn);
    out = { ok: true, result: fn.apply(null, Array.isArray(req.args) ? req.args : []) };
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Spreadsheet ---------- */
function getSS_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SS_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* สร้างใหม่ด้านล่าง */ }
  }
  const active = SpreadsheetApp.getActiveSpreadsheet && SpreadsheetApp.getActiveSpreadsheet();
  const ss = active || SpreadsheetApp.create('พูดอังกฤษทุกวัน - ข้อมูล');
  props.setProperty('SS_ID', ss.getId());
  return ss;
}

function setup() {
  const ss = getSS_();
  ensureSheet_(ss, SHEET_VOCAB, ['english', 'reading', 'thai', 'category', 'tip'], SEED_VOCAB.map(r => applyPron_(r, PRON_VOCAB)));
  ensureEmojiCol_();
  ensureSheet_(ss, SHEET_SENT, ['english', 'reading', 'thai', 'level', 'tip'], SEED_SENT.map(r => applyPron_(r, PRON_SENT)));
  ensureSheet_(ss, SHEET_PROG, ['id', 'type', 'learned_at', 'user'], []);
  ensureAuthSheets_();
  Logger.log('พร้อมใช้งาน: ' + ss.getUrl());
}

function ensureSheet_(ss, name, header, rows) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(header);
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold');
    sh.setFrozenRows(1);
    if (rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);
  }
  return sh;
}

function readTable_(name) {
  const sh = getSS_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues()
    .filter(r => String(r[0]).trim() !== '');
}

function progressOf_(user) {
  return readTable_(SHEET_PROG).filter(r => String(r[3] || '') === user);
}
function learnedSet_(user) {
  return new Set(progressOf_(user).map(r => String(r[0])));
}

/* ---------- API เรียกจากหน้าเว็บ ---------- */

// สุ่มคำศัพท์ n คำ และประโยค m ประโยค (เลือกที่ยังไม่ได้ฝึกก่อน)
function getRandomSet(token, n, m, category, level) {
  const user = requireUser_(token);
  const learned = learnedSet_(user);
  const allVocab = readTable_(SHEET_VOCAB).map(r => ({
    id: 'w:' + r[0], en: String(r[0]), rd: String(r[1]), th: String(r[2]), cat: String(r[3]), tip: String(r[4] || ''), emoji: emojiFor_(r[0], r[5])
  }));
  const allSents = readTable_(SHEET_SENT).map(r => ({
    id: 's:' + r[0], en: String(r[0]), rd: String(r[1]), th: String(r[2]), lvl: String(r[3]), tip: String(r[4] || '')
  }));
  const vocab = category ? allVocab.filter(v => v.cat === category) : allVocab;
  const sents = level ? allSents.filter(s => s.lvl === level) : allSents;

  // ความคืบหน้าแยกตามหมวด / ระดับ
  const group = (list, key) => unique_(list.map(x => x[key])).map(name => {
    const items = list.filter(x => x[key] === name);
    return { name: name, total: items.length, learned: items.filter(x => learned.has(x.id)).length };
  });

  return {
    words: pick_(vocab, n || 5, learned),
    sentences: pick_(sents, m || 3, learned),
    categories: group(allVocab, 'cat'),
    levels: group(allSents, 'lvl'),
    stats: getStats_(user, learned),
    bankLeft: bankLeft_(),
    autoOn: !!geminiKey_(),
    review: (syncReview_(user), reviewCounts_(user))
  };
}

// สำหรับโหมดฝึกฟัง: คืนข้อมูลทั้งหมดให้หน้าเว็บสุ่มคำถามเอง
function getAllForQuiz() {
  return {
    words: readTable_(SHEET_VOCAB).map(r => ({ en: String(r[0]), rd: String(r[1]), th: String(r[2]), tip: String(r[4] || ''), emoji: emojiFor_(r[0], r[5]) })),
    sentences: readTable_(SHEET_SENT).map(r => ({ en: String(r[0]), rd: String(r[1]), th: String(r[2]), tip: String(r[4] || '') }))
  };
}

function markLearned(token, id, type) {
  const user = requireUser_(token);
  const learned = learnedSet_(user);
  if (!learned.has(id)) {
    getSS_().getSheetByName(SHEET_PROG).appendRow([id, type, new Date(), user]);
    learned.add(id);
  }
  return getStats_(user, learned);
}

function getStats_(user, learned) {
  const prog = progressOf_(user);
  const days = unique_(prog.map(r => Utilities.formatDate(new Date(r[2]), 'Asia/Bangkok', 'yyyy-MM-dd')));
  // นับวันติดกันย้อนจากวันนี้ (หรือเมื่อวาน ถ้าวันนี้ยังไม่ได้ฝึก)
  const set = new Set(days);
  let streak = 0;
  const d = new Date();
  const key = x => Utilities.formatDate(x, 'Asia/Bangkok', 'yyyy-MM-dd');
  if (!set.has(key(d))) d.setDate(d.getDate() - 1);
  while (set.has(key(d))) { streak++; d.setDate(d.getDate() - 1); }
  const today = key(new Date());
  // 7 วันล่าสุด (เก่า → วันนี้) สำหรับจุดแสดงความต่อเนื่องในหน้าแรก
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const w = new Date(); w.setDate(w.getDate() - i);
    week.push({ k: key(w), on: set.has(key(w)) });
  }
  return {
    learned: learned.size,
    today: prog.filter(r => key(new Date(r[2])) === today).length,
    streak: streak,
    week: week
  };
}

/* ---------- เพิ่มคำศัพท์ ---------- */

// เพิ่มคำใหม่รายวัน — ทริกเกอร์เรียกทุกเช้า: ใช้คลังใน WordBank.gs ก่อน หมดแล้วให้ Gemini สร้างใหม่ (AutoWords.gs)
function addDailyWords(nWords, nSents) {
  // ทริกเกอร์ส่ง event object มาเป็นอาร์กิวเมนต์แรก จึงต้องเช็กว่าเป็นตัวเลขจริง
  nWords = Number(nWords) > 0 ? Number(nWords) : 5;
  nSents = Number(nSents) > 0 ? Number(nSents) : 2;
  const ss = getSS_();
  const haveW = new Set(readTable_(SHEET_VOCAB).map(r => String(r[0]).toLowerCase()));
  const haveS = new Set(readTable_(SHEET_SENT).map(r => String(r[0]).toLowerCase()));
  const newW = BANK_VOCAB.filter(r => !haveW.has(r[0].toLowerCase())).slice(0, nWords);
  const newS = BANK_SENT.filter(r => !haveS.has(r[0].toLowerCase())).slice(0, nSents);
  if (newW.length) {
    const sh = ss.getSheetByName(SHEET_VOCAB);
    sh.getRange(sh.getLastRow() + 1, 1, newW.length, 5).setValues(newW.map(r => applyPron_(r, PRON_VOCAB)));
  }
  if (newS.length) {
    const sh = ss.getSheetByName(SHEET_SENT);
    sh.getRange(sh.getLastRow() + 1, 1, newS.length, 5).setValues(newS.map(r => applyPron_(r, PRON_SENT)));
  }
  let words = newW.length, sentences = newS.length, ai = 0, aiError = '';
  // คลังไม่พอ → ให้ Gemini สร้างส่วนที่ขาด (ถ้าตั้งค่า GEMINI_API_KEY ไว้)
  if ((words < nWords || sentences < nSents) && geminiKey_()) {
    try {
      const g = generateWords_(nWords - words, Math.max(nSents - sentences, 1));
      saveGenerated_(g);
      ai = g.words.length + g.sentences.length;
      words += g.words.length; sentences += g.sentences.length;
    } catch (e) { aiError = e.message; Logger.log(aiError); }
  }
  Logger.log('เพิ่มคำ ' + words + ' คำ, ประโยค ' + sentences + ' ประโยค' + (ai ? ' (สร้างด้วย AI ' + ai + ')' : ''));
  return { words: words, sentences: sentences, ai: ai, aiError: aiError, bankLeft: bankLeft_(), autoOn: !!geminiKey_() };
}

// รันครั้งเดียว: ตั้งให้เพิ่มคำอัตโนมัติทุกวันตอน 6 โมงเช้า
function installDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'addDailyWords')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('addDailyWords').timeBased().everyDays(1).atHour(6)
    .inTimezone('Asia/Bangkok').create();
  Logger.log('ตั้งเวลาเพิ่มคำทุกวัน 06:00 แล้ว');
}

// เรียกจากฟอร์มในหน้าเว็บ
// เรียกจากปุ่มในหน้าเว็บ (ต้องเข้าสู่ระบบ)
function addFromBank(token) {
  requireUser_(token);
  return addDailyWords(5, 2);
}

function addWord(token, en, rd, th, cat, tip, emoji) {
  requireUser_(token);
  emoji = String(emoji || '').trim().slice(0, 16);
  en = String(en || '').trim(); rd = String(rd || '').trim();
  th = String(th || '').trim(); cat = String(cat || '').trim() || 'คำของฉัน';
  tip = String(tip || '').trim();
  if (!en || !th) throw new Error('กรอกคำภาษาอังกฤษและคำแปลก่อน');
  const have = new Set(readTable_(SHEET_VOCAB).map(r => String(r[0]).toLowerCase()));
  if (have.has(en.toLowerCase())) throw new Error('มีคำว่า "' + en + '" อยู่แล้ว');
  ensureEmojiCol_();
  getSS_().getSheetByName(SHEET_VOCAB).appendRow([en, rd, th, cat, tip, emoji]);
  return 'เพิ่ม "' + en + '" แล้ว';
}

// เพิ่มหัวคอลัมน์ emoji (F) ในชีต Vocab ถ้ายังไม่มี
function ensureEmojiCol_() {
  const sh = getSS_().getSheetByName(SHEET_VOCAB);
  if (sh && !sh.getRange(1, 6).getValue()) sh.getRange(1, 6).setValue('emoji').setFontWeight('bold');
}

function bankLeft_() {
  const haveW = new Set(readTable_(SHEET_VOCAB).map(r => String(r[0]).toLowerCase()));
  return BANK_VOCAB.filter(r => !haveW.has(r[0].toLowerCase())).length;
}

/* ---------- utils ---------- */
function shuffle_(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick_(list, k, learned) {
  const fresh = shuffle_(list.filter(x => !learned.has(x.id)));
  const old = shuffle_(list.filter(x => learned.has(x.id)));
  return fresh.concat(old).slice(0, k).map(x => Object.assign(x, { learned: learned.has(x.id) }));
}
function unique_(a) { return [...new Set(a.filter(x => x))]; }

/* ---------- ข้อมูลตั้งต้น ---------- */
const SEED_VOCAB = [
  ['hello', 'เฮลโล', 'สวัสดี', 'ทักทาย'],
  ['good morning', 'กู๊ด มอร์นิง', 'สวัสดีตอนเช้า', 'ทักทาย'],
  ['thank you', 'แธงค์ ยู', 'ขอบคุณ', 'ทักทาย'],
  ['sorry', 'ซอร์รี่', 'ขอโทษ', 'ทักทาย'],
  ['please', 'พลีส', 'กรุณา / ได้โปรด', 'ทักทาย'],
  ['excuse me', 'เอ็กซ์คิวส์ มี', 'ขอโทษนะ (ขอทาง/เรียก)', 'ทักทาย'],
  ['goodbye', 'กู๊ดบาย', 'ลาก่อน', 'ทักทาย'],
  ['welcome', 'เวลคัม', 'ยินดีต้อนรับ', 'ทักทาย'],
  ['friend', 'เฟรนด์', 'เพื่อน', 'คนรอบตัว'],
  ['family', 'แฟมิลี', 'ครอบครัว', 'คนรอบตัว'],
  ['boss', 'บอส', 'หัวหน้า', 'คนรอบตัว'],
  ['colleague', 'คอล-ลีก', 'เพื่อนร่วมงาน', 'คนรอบตัว'],
  ['today', 'ทู-เดย์', 'วันนี้', 'เวลา'],
  ['tomorrow', 'ทู-มอร์-โรว์', 'พรุ่งนี้', 'เวลา'],
  ['yesterday', 'เยส-เตอร์-เดย์', 'เมื่อวาน', 'เวลา'],
  ['morning', 'มอร์-นิง', 'ตอนเช้า', 'เวลา'],
  ['afternoon', 'อาฟ-เตอร์-นูน', 'ตอนบ่าย', 'เวลา'],
  ['evening', 'อีฟ-นิง', 'ตอนเย็น', 'เวลา'],
  ['week', 'วีค', 'สัปดาห์', 'เวลา'],
  ['month', 'มันธ์', 'เดือน', 'เวลา'],
  ['hour', 'อาว-เออร์', 'ชั่วโมง', 'เวลา'],
  ['go', 'โก', 'ไป', 'กริยาพื้นฐาน'],
  ['come', 'คัม', 'มา', 'กริยาพื้นฐาน'],
  ['eat', 'อีท', 'กิน', 'กริยาพื้นฐาน'],
  ['drink', 'ดริงค์', 'ดื่ม', 'กริยาพื้นฐาน'],
  ['work', 'เวิร์ค', 'ทำงาน', 'กริยาพื้นฐาน'],
  ['want', 'วอนท์', 'ต้องการ', 'กริยาพื้นฐาน'],
  ['need', 'นีด', 'จำเป็นต้อง', 'กริยาพื้นฐาน'],
  ['like', 'ไลค์', 'ชอบ', 'กริยาพื้นฐาน'],
  ['know', 'โนว์', 'รู้', 'กริยาพื้นฐาน'],
  ['think', 'ธิงค์', 'คิด', 'กริยาพื้นฐาน'],
  ['help', 'เฮลพ์', 'ช่วย', 'กริยาพื้นฐาน'],
  ['learn', 'เลิร์น', 'เรียนรู้', 'กริยาพื้นฐาน'],
  ['good', 'กู๊ด', 'ดี', 'คำบอกลักษณะ'],
  ['bad', 'แบด', 'แย่', 'คำบอกลักษณะ'],
  ['busy', 'บิ-ซี่', 'ยุ่ง', 'คำบอกลักษณะ'],
  ['easy', 'อี-ซี่', 'ง่าย', 'คำบอกลักษณะ'],
  ['difficult', 'ดิฟ-ฟิ-คัลท์', 'ยาก', 'คำบอกลักษณะ'],
  ['ready', 'เรด-ดี้', 'พร้อม', 'คำบอกลักษณะ'],
  ['happy', 'แฮป-ปี้', 'มีความสุข', 'คำบอกลักษณะ'],
  ['tired', 'ไท-เอิร์ด', 'เหนื่อย', 'คำบอกลักษณะ'],
  ['important', 'อิม-พอร์-แทนท์', 'สำคัญ', 'คำบอกลักษณะ'],
  ['data', 'เด-ต้า', 'ข้อมูล', 'ที่ทำงาน'],
  ['database', 'เด-ต้า-เบส', 'ฐานข้อมูล', 'ที่ทำงาน'],
  ['table', 'เท-เบิล', 'ตาราง', 'ที่ทำงาน'],
  ['report', 'รี-พอร์ต', 'รายงาน', 'ที่ทำงาน'],
  ['meeting', 'มีท-ทิง', 'การประชุม', 'ที่ทำงาน'],
  ['deadline', 'เดด-ไลน์', 'กำหนดส่ง', 'ที่ทำงาน'],
  ['problem', 'พรอบ-เบลม', 'ปัญหา', 'ที่ทำงาน'],
  ['fix', 'ฟิกซ์', 'แก้ไข', 'ที่ทำงาน'],
  ['check', 'เช็ค', 'ตรวจสอบ', 'ที่ทำงาน'],
  ['update', 'อัพ-เดท', 'อัปเดต', 'ที่ทำงาน'],
  ['project', 'โพร-เจกต์', 'โปรเจกต์', 'ที่ทำงาน'],
  ['pipeline', 'ไปป์-ไลน์', 'ไปป์ไลน์ (ลำดับขั้นตอนข้อมูล)', 'ที่ทำงาน']
];

const SEED_SENT = [
  ['My name is Benz.', 'มาย เนม อิส เบนซ์', 'ผมชื่อเบนซ์', '1 ประโยคสั้น'],
  ['Nice to meet you.', 'ไนซ์ ทู มีท ยู', 'ยินดีที่ได้รู้จัก', '1 ประโยคสั้น'],
  ['How are you?', 'ฮาว อาร์ ยู', 'สบายดีไหม', '1 ประโยคสั้น'],
  ["I'm fine, thank you.", 'ไอม์ ไฟน์ แธงค์ ยู', 'สบายดี ขอบคุณ', '1 ประโยคสั้น'],
  ['I like coffee.', 'ไอ ไลค์ คอฟ-ฟี่', 'ฉันชอบกาแฟ', '1 ประโยคสั้น'],
  ["I don't know.", 'ไอ โดนท์ โนว์', 'ฉันไม่รู้', '1 ประโยคสั้น'],
  ['Can you help me?', 'แคน ยู เฮลพ์ มี', 'ช่วยฉันหน่อยได้ไหม', '1 ประโยคสั้น'],
  ['See you tomorrow.', 'ซี ยู ทู-มอร์-โรว์', 'เจอกันพรุ่งนี้', '1 ประโยคสั้น'],
  ['What time is it?', 'วอท ไทม์ อิส อิท', 'กี่โมงแล้ว', '2 ชีวิตประจำวัน'],
  ["I wake up at six o'clock.", 'ไอ เวค อัพ แอท ซิกซ์ โอ-คล็อก', 'ฉันตื่นตอนหกโมง', '2 ชีวิตประจำวัน'],
  ["I'm going to work.", 'ไอม์ โก-อิง ทู เวิร์ค', 'ฉันกำลังไปทำงาน', '2 ชีวิตประจำวัน'],
  ['Where is the bathroom?', 'แวร์ อิส เดอะ บาธ-รูม', 'ห้องน้ำอยู่ที่ไหน', '2 ชีวิตประจำวัน'],
  ['How much is this?', 'ฮาว มัช อิส ดิส', 'อันนี้ราคาเท่าไหร่', '2 ชีวิตประจำวัน'],
  ["I'm a little tired today.", 'ไอม์ อะ ลิต-เทิล ไท-เอิร์ด ทู-เดย์', 'วันนี้ฉันเหนื่อยนิดหน่อย', '2 ชีวิตประจำวัน'],
  ['Could you say that again?', 'คุด ยู เซย์ แดท อะ-เกน', 'พูดอีกครั้งได้ไหม', '2 ชีวิตประจำวัน'],
  ["Let's have lunch together.", 'เล็ทส์ แฮฟ ลันช์ ทู-เก-เธอร์', 'ไปกินข้าวเที่ยงด้วยกันเถอะ', '2 ชีวิตประจำวัน'],
  ["I'm working on a new project.", 'ไอม์ เวิร์ค-คิง ออน อะ นิว โพร-เจกต์', 'ฉันกำลังทำโปรเจกต์ใหม่', '3 ที่ทำงาน'],
  ['The report is ready.', 'เดอะ รี-พอร์ต อิส เรด-ดี้', 'รายงานพร้อมแล้ว', '3 ที่ทำงาน'],
  ['I will check the data.', 'ไอ วิล เช็ค เดอะ เด-ต้า', 'ฉันจะตรวจสอบข้อมูล', '3 ที่ทำงาน'],
  ['Can we have a meeting tomorrow?', 'แคน วี แฮฟ อะ มีท-ทิง ทู-มอร์-โรว์', 'เราประชุมกันพรุ่งนี้ได้ไหม', '3 ที่ทำงาน'],
  ['I found a problem in the database.', 'ไอ ฟาวนด์ อะ พรอบ-เบลม อิน เดอะ เด-ต้า-เบส', 'ฉันเจอปัญหาในฐานข้อมูล', '3 ที่ทำงาน'],
  ['I need more time to fix it.', 'ไอ นีด มอร์ ไทม์ ทู ฟิกซ์ อิท', 'ฉันต้องการเวลาเพิ่มเพื่อแก้มัน', '3 ที่ทำงาน'],
  ['The deadline is next Friday.', 'เดอะ เดด-ไลน์ อิส เน็กซ์ ฟราย-เดย์', 'กำหนดส่งคือวันศุกร์หน้า', '3 ที่ทำงาน'],
  ['Let me update the table.', 'เล็ท มี อัพ-เดท เดอะ เท-เบิล', 'ให้ฉันอัปเดตตารางนะ', '3 ที่ทำงาน'],
  ["I'm a senior data engineer.", 'ไอม์ อะ ซี-เนียร์ เด-ต้า เอน-จิ-เนียร์', 'ผมเป็นวิศวกรข้อมูลอาวุโส', '4 สัมภาษณ์งาน'],
  ['I build data pipelines.', 'ไอ บิลด์ เด-ต้า ไปป์-ไลน์ส', 'ผมสร้างไปป์ไลน์ข้อมูล', '4 สัมภาษณ์งาน'],
  ['I enjoy solving problems.', 'ไอ เอน-จอย ซอล-วิง พรอบ-เบลมส์', 'ผมชอบแก้ปัญหา', '4 สัมภาษณ์งาน'],
  ['I work well with my team.', 'ไอ เวิร์ค เวล วิธ มาย ทีม', 'ผมทำงานร่วมกับทีมได้ดี', '4 สัมภาษณ์งาน'],
  ['I want to learn cloud platforms.', 'ไอ วอนท์ ทู เลิร์น คลาวด์ แพลต-ฟอร์มส์', 'ผมอยากเรียนรู้แพลตฟอร์มคลาวด์', '4 สัมภาษณ์งาน'],
  ['My strength is attention to detail.', 'มาย สเตรงธ์ อิส อะ-เทน-ชัน ทู ดี-เทล', 'จุดแข็งของผมคือความละเอียดรอบคอบ', '4 สัมภาษณ์งาน'],
  ['Could you tell me more about the role?', 'คุด ยู เทล มี มอร์ อะ-เบาท์ เดอะ โรล', 'ช่วยเล่าเกี่ยวกับตำแหน่งนี้เพิ่มได้ไหม', '4 สัมภาษณ์งาน'],
  ['Thank you for your time.', 'แธงค์ ยู ฟอร์ ยัวร์ ไทม์', 'ขอบคุณที่สละเวลา', '4 สัมภาษณ์งาน']
];
