# พูดอังกฤษทุกวัน

เว็บฝึกพูด ฟัง และทบทวนคำศัพท์ภาษาอังกฤษ พร้อมคำอ่านภาษาไทย

- เว็บ: https://hinthang.github.io/speak-daily/
- หน้าเว็บ: `index.html` (GitHub Pages)
- หลังบ้าน + API: `apps-script/` (Google Apps Script + Google Sheet)

## การอัปเดต
แก้ไฟล์แล้ว Commit ที่ `main` ได้เลย
- `index.html` → GitHub Pages อัปเดตเอง (1–2 นาที)
- `apps-script/*` หรือ `index.html` → GitHub Actions ส่งโค้ดเข้า Apps Script และ Deploy เป็นเวอร์ชันใหม่บนลิงก์เดิมให้อัตโนมัติ (ดูสถานะที่แท็บ Actions)

## ข้อควรรู้
- `clasp push` แทนที่ไฟล์ทั้งโปรเจกต์ใน Apps Script → แก้โค้ดที่ repo นี้เท่านั้น อย่าแก้ใน Apps Script โดยตรง (จะถูกทับ)
- Apps Script เก็บเวอร์ชันได้สูงสุด 200 เวอร์ชัน ถ้าใกล้เต็มให้ลบเวอร์ชันเก่าใน Project History
- ข้อมูลลับ (Gemini key) อยู่ใน Script properties ไม่ได้อยู่ใน repo
