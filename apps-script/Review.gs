/**
 * ทบทวนตามรอบ (Spaced Repetition แบบ Leitner)
 * คำ/ประโยคที่ "ฝึกแล้ว" จะถูกนัดทบทวน: 1 → 3 → 7 → 14 → 30 → 60 วัน
 *   จำได้ = ขยับไปรอบถัดไป · จำได้แต่ออกเสียงยังไม่ชัด = ทบทวนพรุ่งนี้ (อยู่รอบเดิม)
 *   จำไม่ได้ = กลับไปเริ่มรอบแรก
 * Sheet "Review": user | id | type | box | due_day | last_day | lapses
 *   due_day/last_day เป็นเลขวัน (นับวันตามเวลาไทย) เพื่อไม่ให้เพี้ยนเรื่องโซนเวลา
 */
const SHEET_REV = 'Review';
const REV_DAYS = [1, 3, 7, 14, 30, 60];

function dayNum_(d) { return Math.floor(((d ? new Date(d) : new Date()).getTime() + 7 * 3600e3) / 864e5); }

function revSheet_() {
  return ensureSheet_(getSS_(), SHEET_REV, ['user', 'id', 'type', 'box', 'due_day', 'last_day', 'lapses'], []);
}

function reviewRows_(user) {
  const sh = revSheet_();
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues()
    .map((r, i) => ({ row: i + 2, user: String(r[0]), id: String(r[1]), type: String(r[2]),
      box: Number(r[3]) || 0, due: Number(r[4]) || 0, lapses: Number(r[6]) || 0 }))
    .filter(x => x.user === user);
}

// เพิ่มรายการที่ฝึกแล้วแต่ยังไม่อยู่ในตารางทบทวน (นัดครั้งแรก = วันถัดจากที่ฝึก)
function syncReview_(user) {
  const have = new Set(reviewRows_(user).map(x => x.id));
  const seen = new Set();
  const add = [];
  progressOf_(user).forEach(r => {
    const id = String(r[0]);
    if (have.has(id) || seen.has(id)) return;
    seen.add(id);
    add.push([user, id, String(r[1]), 0, dayNum_(r[2]) + 1, '', 0]);
  });
  if (add.length) {
    const sh = revSheet_();
    sh.getRange(sh.getLastRow() + 1, 1, add.length, 7).setValues(add);
  }
}

function reviewCounts_(user) {
  const today = dayNum_();
  const rows = reviewRows_(user);
  return { due: rows.filter(x => x.due <= today).length, tomorrow: rows.filter(x => x.due === today + 1).length, total: rows.length };
}

// เนื้อหาของแต่ละ id (จากชีตคำศัพท์/ประโยค และบทเรียน)
function contentMap_() {
  const map = {};
  readTable_(SHEET_VOCAB).forEach(r => { map['w:' + r[0]] = { en: String(r[0]), rd: String(r[1]), th: String(r[2]), tip: String(r[4] || ''), cat: String(r[3]) }; });
  readTable_(SHEET_SENT).forEach(r => { map['s:' + r[0]] = { en: String(r[0]), rd: String(r[1]), th: String(r[2]), tip: String(r[4] || ''), cat: String(r[3]) }; });
  LESSONS.forEach(l => {
    l.words.forEach(w => { if (!map['w:' + w[0]]) map['w:' + w[0]] = { en: w[0], rd: w[1], th: w[2], tip: '', cat: l.title }; });
    l.sentences.concat(l.patterns || []).forEach(s => {
      const x = s.length === 4 ? s.slice(1) : s;    // patterns มีคอลัมน์รูปแบบนำหน้า
      if (!map['s:' + x[0]]) map['s:' + x[0]] = { en: x[0], rd: x[1], th: x[2], tip: '', cat: l.title };
    });
  });
  return map;
}

// ชุดทบทวนวันนี้ (ถึงกำหนดก่อน, เคยลืมบ่อยก่อน)
function getReviewSet(token, n) {
  const user = requireUser_(token);
  syncReview_(user);
  const today = dayNum_();
  const map = contentMap_();
  const due = reviewRows_(user).filter(x => x.due <= today && map[x.id])
    .sort((a, b) => a.due - b.due || b.lapses - a.lapses);
  const items = due.slice(0, Number(n) || 15).map(x => Object.assign({ id: x.id, type: x.type, box: x.box, lapses: x.lapses }, map[x.id]));
  return { items: items, counts: reviewCounts_(user) };
}

// บันทึกผล: grade = 'again' | 'hard' | 'good'
function reviewResult(token, id, grade) {
  const user = requireUser_(token);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const x = reviewRows_(user).find(r => r.id === id);
    if (!x) return reviewCounts_(user);
    const today = dayNum_();
    let box = x.box, due, lapses = x.lapses;
    if (grade === 'good') { box = Math.min(box + 1, REV_DAYS.length - 1); due = today + REV_DAYS[box]; }
    else if (grade === 'hard') { due = today + 1; }
    else { box = 0; due = today + 1; lapses++; }
    revSheet_().getRange(x.row, 4, 1, 4).setValues([[box, due, today, lapses]]);
    return reviewCounts_(user);
  } finally {
    lock.releaseLock();
  }
}
