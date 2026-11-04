/**
 * ระบบผู้ใช้: ชื่อผู้ใช้ + PIN (4–6 หลัก)
 * - Sheet "Users":    username | display_name | pin_hash | salt | color | created_at | last_login
 * - Sheet "Sessions": token | username | created_at
 * - PIN เก็บแบบ hash (SHA-256 + salt) ไม่เก็บตัวเลขจริง
 * - กรอก PIN ผิด 5 ครั้ง จะล็อกชื่อนั้น 10 นาที
 */
const SHEET_USERS = 'Users';
const SHEET_SESS = 'Sessions';
const SESSION_DAYS = 60;
const AVATAR_COLORS = ['#2F6BFF', '#FF6B4A', '#12B76A', '#9B5CFF', '#FFB020', '#FF4D94', '#14B8C4'];

function ensureAuthSheets_() {
  const ss = getSS_();
  ensureSheet_(ss, SHEET_USERS, ['username', 'display_name', 'pin_hash', 'salt', 'color', 'created_at', 'last_login'], []);
  ensureSheet_(ss, SHEET_SESS, ['token', 'username', 'created_at'], []);
  const prog = ensureSheet_(ss, SHEET_PROG, ['id', 'type', 'learned_at', 'user'], []);
  if (!prog.getRange(1, 4).getValue()) prog.getRange(1, 4).setValue('user').setFontWeight('bold');
}

function hash_(pin, salt) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

function findUser_(username) {
  const rows = readTable_(SHEET_USERS);
  const i = rows.findIndex(r => String(r[0]) === username);
  return i < 0 ? null : { row: i + 2, username: String(rows[i][0]), name: String(rows[i][1]),
    hash: String(rows[i][2]), salt: String(rows[i][3]), color: String(rows[i][4]) };
}

// อักษรย่อสำหรับรูปโปรไฟล์: ข้ามสระหน้า (เ แ โ ใ ไ) เช่น "เบนซ์" → "บ"
function initialOf_(name) {
  const s = String(name || '').trim().replace(/^[เแโใไ]+/, '');
  return (s.charAt(0) || '?').toUpperCase();
}

function publicUser_(u) {
  return { username: u.username, name: u.name, color: u.color, initial: initialOf_(u.name) };
}

function newSession_(username) {
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  getSS_().getSheetByName(SHEET_SESS).appendRow([token, username, new Date()]);
  CacheService.getScriptCache().put('tok:' + token, username, 21600);
  return token;
}

function normUsername_(s) { return String(s || '').trim().toLowerCase(); }

/* ---------- เรียกจากหน้าเว็บ ---------- */

function register(username, displayName, pin) {
  ensureAuthSheets_();
  username = normUsername_(username);
  displayName = String(displayName || '').trim() || username;
  pin = String(pin || '');
  if (!/^[a-z0-9_.]{3,20}$/.test(username)) throw new Error('ชื่อผู้ใช้ใช้ได้เฉพาะ a-z, 0-9, _ และ . ยาว 3–20 ตัว');
  if (!/^\d{4,6}$/.test(pin)) throw new Error('PIN ต้องเป็นตัวเลข 4–6 หลัก');
  if (displayName.length > 30) throw new Error('ชื่อที่แสดงยาวได้ไม่เกิน 30 ตัวอักษร');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (findUser_(username)) throw new Error('ชื่อผู้ใช้นี้มีคนใช้แล้ว ลองชื่ออื่น');
    const isFirst = readTable_(SHEET_USERS).length === 0;
    const salt = Utilities.getUuid();
    const color = AVATAR_COLORS[readTable_(SHEET_USERS).length % AVATAR_COLORS.length];
    getSS_().getSheetByName(SHEET_USERS).appendRow([username, displayName, hash_(pin, salt), salt, color, new Date(), new Date()]);
    if (isFirst) claimLegacyProgress_(username);   // ผู้ใช้คนแรกได้ความคืบหน้าเดิมก่อนมีระบบผู้ใช้
    const u = findUser_(username);
    return { token: newSession_(username), user: publicUser_(u) };
  } finally {
    lock.releaseLock();
  }
}

function login(username, pin) {
  ensureAuthSheets_();
  username = normUsername_(username);
  const cache = CacheService.getScriptCache();
  const failKey = 'fail:' + username;
  const fails = Number(cache.get(failKey) || 0);
  if (fails >= 5) throw new Error('กรอก PIN ผิดหลายครั้ง ลองใหม่อีกครั้งใน 10 นาที');
  const u = findUser_(username);
  if (!u || hash_(String(pin || ''), u.salt) !== u.hash) {
    cache.put(failKey, String(fails + 1), 600);
    throw new Error('ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง');
  }
  cache.remove(failKey);
  getSS_().getSheetByName(SHEET_USERS).getRange(u.row, 7).setValue(new Date());
  return { token: newSession_(username), user: publicUser_(u) };
}

function me(token) {
  try { return publicUser_(findUser_(requireUser_(token))); } catch (e) { return null; }
}

function logout(token) {
  CacheService.getScriptCache().remove('tok:' + token);
  const sh = getSS_().getSheetByName(SHEET_SESS);
  const rows = readTable_(SHEET_SESS);
  for (let i = rows.length - 1; i >= 0; i--) if (String(rows[i][0]) === token) sh.deleteRow(i + 2);
  return true;
}

// คืน username ของ token นี้ หรือโยน error ถ้าไม่ได้เข้าสู่ระบบ
function requireUser_(token) {
  if (!token) throw new Error('SESSION_EXPIRED');
  const cache = CacheService.getScriptCache();
  const hit = cache.get('tok:' + token);
  if (hit) return hit;
  const limit = Date.now() - SESSION_DAYS * 864e5;
  const row = readTable_(SHEET_SESS).find(r => String(r[0]) === token && new Date(r[2]).getTime() > limit);
  if (!row) throw new Error('SESSION_EXPIRED');
  cache.put('tok:' + token, String(row[1]), 21600);
  return String(row[1]);
}

function claimLegacyProgress_(username) {
  const sh = getSS_().getSheetByName(SHEET_PROG);
  const last = sh.getLastRow();
  if (last < 2) return;
  const rng = sh.getRange(2, 4, last - 1, 1);
  rng.setValues(rng.getValues().map(r => [r[0] || username]));
}

// อันดับ 7 วันล่าสุด (นับจำนวนที่ฝึกได้)
function leaderboard(token) {
  const meName = requireUser_(token);
  const since = Date.now() - 7 * 864e5;
  const count = {};
  readTable_(SHEET_PROG).forEach(r => {
    if (r[3] && new Date(r[2]).getTime() >= since) count[r[3]] = (count[r[3]] || 0) + 1;
  });
  return readTable_(SHEET_USERS).map(r => {
    const u = { username: String(r[0]), name: String(r[1]), color: String(r[4]) };
    return { name: u.name, color: u.color, initial: initialOf_(u.name),
      week: count[u.username] || 0, me: u.username === meName };
  }).sort((a, b) => b.week - a.week).slice(0, 10);
}
