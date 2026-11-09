/**
 * ภาพประกอบคำศัพท์ (อีโมจิ) — แสดงเป็นภาพใหญ่ในการ์ดคำศัพท์ ทบทวน บทเรียน และเกมทายจากภาพ
 * ลำดับการเลือกภาพ: คอลัมน์ "emoji" ในชีต Vocab (ถ้ามี) → ตาราง EMOJI ด้านล่าง → ไม่มีภาพ
 * คำใหม่ที่ Gemini สร้าง จะได้ภาพมาในคอลัมน์ emoji ให้อัตโนมัติ
 * อยากเปลี่ยนภาพคำไหน: ใส่อีโมจิในคอลัมน์ F (emoji) ของชีต Vocab ได้เลย
 */
const EMOJI = {
  // ทักทาย / คน
  'hello': '👋', 'good morning': '🌅', 'thank you': '🙏', 'sorry': '🙇', 'please': '🥺', 'excuse me': '🙋',
  'goodbye': '👋', 'welcome': '🤗', 'friend': '🫂', 'family': '🫶', 'boss': '👔', 'colleague': '🧑‍💼',
  'name': '📛', 'from': '🌏', 'job': '💼', 'live': '🏡', 'engineer': '👷',
  // เวลา
  'today': '📅', 'tomorrow': '🗓️', 'yesterday': '⏪', 'morning': '🌄', 'afternoon': '🌤️', 'evening': '🌆',
  'week': '📆', 'month': '🗓️', 'hour': '⏰', 'minute': '⏱️', 'weekend': '🏖️', 'wake up': '⏰',
  'late': '🐢', 'early': '🐓',
  // กริยา
  'go': '🚶', 'come': '🏃', 'eat': '🍽️', 'drink': '🥤', 'work': '💻', 'want': '🤩', 'need': '❗',
  'like': '👍', 'know': '💡', 'think': '🤔', 'help': '🆘', 'learn': '📚', 'speak': '📢', 'listen': '👂',
  'read': '📖', 'write': '✍️', 'ask': '🙋', 'answer': '💬', 'wait': '⏳', 'start': '🏁', 'finish': '🏆',
  'try': '💪', 'remember': '🧠', 'forget': '❓', 'understand': '✅', 'explain': '🧑‍🏫', 'meet': '🤝',
  'buy': '🛍️', 'sell': '🏷️', 'pay': '💳', 'cook': '🧑‍🍳', 'sleep': '😴', 'wash': '🧼', 'clean': '🧹',
  'order': '🧾',
  // ลักษณะ / ความรู้สึก
  'good': '👍', 'bad': '👎', 'busy': '🤹', 'easy': '😎', 'difficult': '🧗', 'ready': '🙌', 'happy': '😄',
  'tired': '😩', 'important': '⭐', 'sad': '😢', 'angry': '😠', 'excited': '🤩', 'worried': '😟',
  'bored': '🥱', 'relaxed': '😌', 'proud': '😊', 'surprised': '😲', 'confused': '😵‍💫', 'nervous': '😬',
  'hungry': '🤤', 'delicious': '😋', 'spicy': '🌶️', 'sweet': '🍬', 'hot': '🥵', 'cold': '🥶',
  'near': '📍', 'far': '🔭', 'cheap': '🪙', 'expensive': '💎', 'secure': '🔒',
  // อาหาร
  'rice': '🍚', 'water': '💧', 'breakfast': '🥐', 'lunch': '🍱', 'dinner': '🍝', 'menu': '📋',
  'bill': '🧾', 'chicken': '🍗', 'fruit': '🍎', 'vegetable': '🥦',
  // เดินทาง
  'car': '🚗', 'bus': '🚌', 'train': '🚆', 'airport': '🛫', 'ticket': '🎫', 'hotel': '🏨', 'left': '⬅️',
  'right': '➡️', 'straight': '⬆️', 'map': '🗺️', 'traffic': '🚦',
  // บ้าน
  'house': '🏠', 'room': '🚪', 'kitchen': '🍳', 'bedroom': '🛏️', 'door': '🚪', 'window': '🪟',
  'bed': '🛏️', 'chair': '🪑',
  // ช้อปปิ้ง
  'price': '🏷️', 'cash': '💵', 'discount': '🏷️', 'size': '📏', 'shop': '🏪',
  // อากาศ
  'weather': '🌦️', 'rain': '🌧️', 'sunny': '☀️', 'cloudy': '☁️', 'wind': '🌬️', 'umbrella': '☂️',
  // ที่ทำงาน
  'meeting': '👥', 'deadline': '⏰', 'problem': '⚠️', 'fix': '🔧', 'check': '✔️', 'update': '🔄',
  'project': '📁', 'report': '📄', 'email': '📧', 'schedule': '📅', 'task': '📝', 'client': '🤝',
  'requirement': '📋', 'solution': '💡', 'decision': '⚖️', 'feedback': '💬', 'priority': '🔝',
  'estimate': '🧮', 'review': '🔍', 'deploy': '🚀', 'experience': '🎖️', 'strength': '💪', 'team': '👥',
  'skill': '🛠️', 'role': '🪪',
  // ข้อมูลและเทค
  'data': '📊', 'database': '🗄️', 'table': '📋', 'pipeline': '🔀', 'query': '🔎', 'column': '📑',
  'row': '📃', 'source': '📥', 'target': '🎯', 'schema': '🗂️', 'load': '⬇️', 'transform': '🔄',
  'error': '❌', 'duplicate': '👯', 'missing': '🕳️', 'performance': '⚡', 'backup': '💾',
  'dashboard': '📈', 'cloud': '☁️', 'storage': '📦', 'batch': '📦', 'index': '🔖', 'total': '🧮',
  'increase': '📈', 'decrease': '📉', 'cost': '💰', 'migrate': '🚚'
};

function emojiFor_(en, sheetValue) {
  const v = String(sheetValue || '').trim();
  if (v) return v;
  return EMOJI[String(en || '').trim().toLowerCase()] || '';
}
