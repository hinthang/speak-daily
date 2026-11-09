/**
 * บทเรียน + แบบทดสอบ
 * แต่ละบท: เรียนคำ/ประโยค แล้วทำแบบทดสอบ ~10 ข้อ (สร้างแบบสุ่มในหน้าเว็บ)
 * ผ่าน = ได้ 60% ขึ้นไป → ปลดล็อกบทถัดไป · ดาว: 60% = 1, 75% = 2, 90% = 3
 *
 * เพิ่มบทใหม่ได้ใน LESSONS ด้านล่าง (id ห้ามซ้ำ)
 *   words:     [english, คำอ่าน, คำแปล]
 *   sentences: [english, คำอ่านทีละคำคั่นด้วยเว้นวรรค, คำแปล]
 *   patterns:  [รูปแบบ, english, คำอ่าน, คำแปล] รูปแบบ = pos บอกเล่า | neg ปฏิเสธ | q คำถาม | past อดีต | fut อนาคต
 *   dialogs:   [คำถาม, คำอ่าน, คำแปล, คำตอบ, คำอ่าน, คำแปล]
 * Sheet "LessonProgress": user | lesson_id | best_pct | stars | updated_at
 */
const SHEET_LP = 'LessonProgress';

const UNITS = [
  { id: 'u1', title: 'ชีวิตประจำวัน 1', desc: 'ทักทาย แนะนำตัว เวลา กิจวัตร' },
  { id: 'u2', title: 'ชีวิตประจำวัน 2', desc: 'ร้านอาหาร ถามทาง ช้อปปิ้ง' },
  { id: 'u3', title: 'ที่ทำงาน', desc: 'นัดประชุม แจ้งปัญหา สัมภาษณ์งาน' },
  { id: 'u4', title: 'สายงาน Data Engineer', desc: 'ไปป์ไลน์ SQL รายงาน คลาวด์' }
];

const LESSONS = [
  { id: 'd1', unit: 'u1', title: 'ทักทาย', icon: 'hand',
    words: [['hello', 'เฮ-โล่ว', 'สวัสดี'], ['good morning', 'กุด มอร์-หนิ่ง', 'สวัสดีตอนเช้า'], ['thank you', 'แธง-คิว', 'ขอบคุณ'], ['sorry', 'ซา-รี่', 'ขอโทษ'], ['goodbye', 'กุด-บาย', 'ลาก่อน']],
    sentences: [['How are you?', 'ฮาว เออร์ ยู', 'สบายดีไหม'], ["I'm fine, thank you.", 'อาม ไฟน์ แธง คิว', 'สบายดี ขอบคุณ'], ['Nice to meet you.', 'ไนซ์ ทะ มี ชู', 'ยินดีที่ได้รู้จัก']],
    patterns: [['pos', 'I am fine today.', 'ไอ แอม ไฟน์ ทะ-เดย์', 'วันนี้ฉันสบายดี'], ['neg', 'I am not fine today.', 'ไอ แอม นอท ไฟน์ ทะ-เดย์', 'วันนี้ฉันไม่ค่อยสบาย'], ['q', 'Are you fine today?', 'อาร์ ยู ไฟน์ ทะ-เดย์', 'วันนี้คุณสบายดีไหม'], ['past', 'I was fine yesterday.', 'ไอ วัซ ไฟน์ เยส-เตอร์-เดย์', 'เมื่อวานฉันสบายดี'], ['fut', 'I will be fine tomorrow.', 'ไอ วิล บี ไฟน์ ทะ-มา-โร่ว', 'พรุ่งนี้ฉันจะดีขึ้น']],
    dialogs: [['How are you?', 'ฮาว เออร์ ยู', 'สบายดีไหม', "I'm good, thanks.", 'อาม กุด แธงส์', 'สบายดี ขอบคุณ'],
              ['Thank you so much.', 'แธง คิว โซ มัช', 'ขอบคุณมาก', "You're welcome.", 'ยัวร์ เวล-คั่ม', 'ด้วยความยินดี']] },
  { id: 'd2', unit: 'u1', title: 'แนะนำตัว', icon: 'user',
    words: [['name', 'เนม', 'ชื่อ'], ['from', 'ฟรัม', 'จาก'], ['job', 'จ็อบ', 'งาน'], ['live', 'ลิฟว์', 'อาศัยอยู่'], ['engineer', 'เอน-จิ-เนียร์', 'วิศวกร']],
    sentences: [['My name is Benz.', 'มาย เนม อิซ เบนซ์', 'ผมชื่อเบนซ์'], ["I'm from Thailand.", 'อาม ฟรัม ไท-แลนด์', 'ผมมาจากประเทศไทย'], ['I live in Bangkok.', 'ไอ ลิฟว์ อิน แบง-ค็อก', 'ผมอาศัยอยู่ที่กรุงเทพฯ']],
    patterns: [['pos', 'I live in Bangkok.', 'ไอ ลิฟว์ อิน แบง-ค็อก', 'ผมอาศัยอยู่กรุงเทพฯ'], ['neg', "I don't live in Bangkok.", 'ไอ โดนท์ ลิฟว์ อิน แบง-ค็อก', 'ผมไม่ได้อาศัยอยู่กรุงเทพฯ'], ['q', 'Do you live in Bangkok?', 'ดู ยู ลิฟว์ อิน แบง-ค็อก', 'คุณอยู่กรุงเทพฯ ไหม'], ['past', 'I lived in Chiang Mai.', 'ไอ ลิฟด์ อิน เชียง ใหม่', 'ผมเคยอยู่เชียงใหม่'], ['fut', 'I will live in Tokyo.', 'ไอ วิล ลิฟว์ อิน โท-เกียว', 'ผมจะไปอยู่โตเกียว']],
    dialogs: [["What's your name?", 'วั้ทส์ ยัวร์ เนม', 'คุณชื่ออะไร', 'My name is Benz.', 'มาย เนม อิซ เบนซ์', 'ผมชื่อเบนซ์'],
              ['What do you do?', 'วั้ท ดะ ยู ดู', 'คุณทำงานอะไร', "I'm a data engineer.", 'อาม มะ เด-ด้า เอน-จิ-เนียร์', 'ผมเป็นวิศวกรข้อมูล']] },
  { id: 'd3', unit: 'u1', title: 'เวลาและวัน', icon: 'clock',
    words: [['today', 'ทะ-เดย์', 'วันนี้'], ['tomorrow', 'ทะ-มา-โร่ว', 'พรุ่งนี้'], ['yesterday', 'เยส-เตอร์-เดย์', 'เมื่อวาน'], ['morning', 'มอร์-หนิ่ง', 'ตอนเช้า'], ['minute', 'มิน-หนิท', 'นาที']],
    sentences: [['What time is it?', 'วั้ท ไทม์ อี ซิท', 'กี่โมงแล้ว'], ['See you tomorrow.', 'ซี ยะ ทะ-มา-โร่ว', 'เจอกันพรุ่งนี้'], ['I wake up at six.', 'ไอ เวค อัพ แอท ซิกซ์', 'ฉันตื่นตอนหกโมง']],
    patterns: [['pos', 'I wake up at six.', 'ไอ เวค อัพ แอท ซิกซ์', 'ฉันตื่นตอนหกโมง'], ['neg', "I don't wake up early.", 'ไอ โดนท์ เวค อัพ เออร์-ลี่', 'ฉันไม่ได้ตื่นเช้า'], ['q', 'What time do you wake up?', 'วั้ท ไทม์ ดู ยู เวค อัพ', 'คุณตื่นกี่โมง'], ['past', 'I woke up late yesterday.', 'ไอ โวค อัพ เลท เยส-เตอร์-เดย์', 'เมื่อวานฉันตื่นสาย'], ['fut', 'I will wake up early tomorrow.', 'ไอ วิล เวค อัพ เออร์-ลี่ ทะ-มา-โร่ว', 'พรุ่งนี้ฉันจะตื่นเช้า']],
    dialogs: [['What time is it?', 'วั้ท ไทม์ อี ซิท', 'กี่โมงแล้ว', "It's three o'clock.", 'อิทส์ ธรี อะ-คล็อก', 'สามโมงแล้ว'],
              ['Are you free tonight?', 'อาร์ ยู ฟรี ทะ-ไนท์', 'คืนนี้ว่างไหม', "Sorry, I'm busy.", 'ซา-รี่ อาม บิซ-ซี่', 'ขอโทษ ไม่ว่าง']] },
  { id: 'd4', unit: 'u1', title: 'กิจวัตรประจำวัน', icon: 'sun',
    words: [['wake up', 'เวค อัพ', 'ตื่นนอน'], ['breakfast', 'เบรค-ฟัสท์', 'อาหารเช้า'], ['traffic', 'แทรฟ-ฟิก', 'การจราจร / รถติด'], ['tired', 'ไท-เอิร์ด', 'เหนื่อย'], ['weekend', 'วีค-เอนด์', 'สุดสัปดาห์']],
    sentences: [["I'm stuck in traffic.", 'อาม สตัก อิน แทรฟ-ฟิก', 'ฉันติดรถอยู่'], ["I'm a little tired today.", 'อาม มะ ลิท-เทิ่ล ไท-เอิร์ด ทะ-เดย์', 'วันนี้เหนื่อยนิดหน่อย'], ['What did you do last weekend?', 'วั้ท ดิด จู ดู ลาสท์ วีค-เอนด์', 'สุดสัปดาห์ที่แล้วทำอะไร']],
    patterns: [['pos', 'I go to work by train.', 'ไอ โก ทะ เวิร์ก บาย เทรน', 'ฉันไปทำงานด้วยรถไฟ'], ['neg', "I don't go to work on Sunday.", 'ไอ โดนท์ โก ทะ เวิร์ก ออน ซัน-เดย์', 'วันอาทิตย์ฉันไม่ไปทำงาน'], ['q', 'How do you go to work?', 'ฮาว ดู ยู โก ทะ เวิร์ก', 'คุณไปทำงานยังไง'], ['past', 'I went to work early today.', 'ไอ เวนท์ ทะ เวิร์ก เออร์-ลี่ ทะ-เดย์', 'วันนี้ฉันไปทำงานเช้า'], ['fut', 'I will work from home tomorrow.', 'ไอ วิล เวิร์ก ฟรัม โฮม ทะ-มา-โร่ว', 'พรุ่งนี้ฉันจะทำงานที่บ้าน']],
    dialogs: [['How was your weekend?', 'ฮาว วัซ ยัวร์ วีค-เอนด์', 'สุดสัปดาห์เป็นยังไงบ้าง', 'It was great.', 'อิท วัซ เกรท', 'ดีมากเลย'],
              ['Did you have breakfast?', 'ดิด จู แฮฟ เบรค-ฟัสท์', 'กินข้าวเช้าหรือยัง', "Not yet, I'm hungry.", 'นอท เยท อาม ฮัง-กรี้', 'ยังเลย หิวแล้ว']] },
  { id: 'd5', unit: 'u2', title: 'ร้านอาหาร', icon: 'food',
    words: [['menu', 'เมน-นิว', 'เมนู'], ['order', 'ออร์-เดอร์', 'สั่ง (อาหาร)'], ['water', 'วอ-เด่อร์', 'น้ำ'], ['delicious', 'ดิ-ลิ-ชัส', 'อร่อย'], ['bill', 'บิล', 'ใบเสร็จ / เช็คบิล']],
    sentences: [['This is delicious.', 'ดิส อิซ ดิ-ลิ-ชัส', 'อันนี้อร่อย'], ['Can I have some water?', 'เคิน ไน แฮฟ ซัม วอ-เด่อร์', 'ขอน้ำหน่อยได้ไหม'], ['Can I have the bill, please?', 'เคิน ไน แฮฟ เดอะ บิล พลีซ', 'ขอเช็คบิลด้วยครับ']],
    patterns: [['pos', 'I want some coffee.', 'ไอ ว้อนท์ ซัม คอ-ฟี่', 'ฉันอยากได้กาแฟ'], ['neg', "I don't want any sugar.", 'ไอ โดนท์ ว้อนท์ เอ็น-นี่ ชู-การ์', 'ฉันไม่เอาน้ำตาล'], ['q', 'Do you want some water?', 'ดู ยู ว้อนท์ ซัม วอ-เด่อร์', 'คุณอยากได้น้ำไหม'], ['past', 'I ordered fried rice.', 'ไอ ออร์-เดอร์ด ไฟรด์ ไรซ์', 'ฉันสั่งข้าวผัดไปแล้ว'], ['fut', 'I will order a pizza.', 'ไอ วิล ออร์-เดอร์ อะ พิซ-ซ่า', 'ฉันจะสั่งพิซซ่า']],
    dialogs: [['Are you ready to order?', 'อาร์ ยู เร-ดี้ ทะ ออร์-เดอร์', 'พร้อมสั่งอาหารหรือยัง', 'Can I have a coffee?', 'เคิน ไน แฮฟ วะ คอ-ฟี่', 'ขอกาแฟหนึ่งแก้ว'],
              ['Anything else?', 'เอ็น-นี่-ธิง เอลส์', 'รับอะไรเพิ่มไหม', "No, that's all.", 'โน แดทส์ ออล', 'ไม่ครับ แค่นี้']] },
  { id: 'd6', unit: 'u2', title: 'ถามทาง', icon: 'plane',
    words: [['left', 'เลฟท์', 'ซ้าย'], ['right', 'ไรท์', 'ขวา'], ['straight', 'สเตรท', 'ตรงไป'], ['near', 'เนียร์', 'ใกล้'], ['far', 'ฟาร์', 'ไกล']],
    sentences: [['Where is the station?', 'แวร์ อิซ เดอะ สเต-ชั่น', 'สถานีอยู่ที่ไหน'], ['Go straight and turn left.', 'โก สเตรท แอน เทิร์น เลฟท์', 'ตรงไปแล้วเลี้ยวซ้าย'], ["It's near here.", 'อิทส์ เนียร์ เฮียร์', 'อยู่ใกล้ๆ นี่เอง']],
    patterns: [['pos', 'Turn left at the corner.', 'เทิร์น เลฟท์ แอท เดอะ คอร์-เน่อร์', 'เลี้ยวซ้ายตรงหัวมุม'], ['neg', "Don't turn right here.", 'โดนท์ เทิร์น ไรท์ เฮียร์', 'อย่าเลี้ยวขวาตรงนี้'], ['q', 'Should I turn left here?', 'ชุด ไอ เทิร์น เลฟท์ เฮียร์', 'ต้องเลี้ยวซ้ายตรงนี้ไหม'], ['past', 'I turned the wrong way.', 'ไอ เทิร์นด์ เดอะ รอง เวย์', 'ฉันเลี้ยวผิดทาง'], ['fut', 'We will arrive soon.', 'วี วิล อะ-ไรฟว์ ซูน', 'เราจะถึงเร็วๆ นี้']],
    dialogs: [['Where is the station?', 'แวร์ อิซ เดอะ สเต-ชั่น', 'สถานีอยู่ที่ไหน', "It's on the left.", 'อิทส์ ออน เดอะ เลฟท์', 'อยู่ทางซ้าย'],
              ['Is it far from here?', 'อิซ ซิท ฟาร์ ฟรัม เฮียร์', 'ไกลจากที่นี่ไหม', "No, it's very close.", 'โน อิทส์ เว-รี่ โคลส', 'ไม่ไกล ใกล้มาก']] },
  { id: 'd7', unit: 'u2', title: 'ช้อปปิ้ง', icon: 'bag',
    words: [['price', 'ไพรซ์', 'ราคา'], ['cheap', 'ชีพ', 'ถูก (ราคา)'], ['expensive', 'อิก-สเปน-ซีฟ', 'แพง'], ['pay', 'เพย์', 'จ่าย'], ['discount', 'ดิส-เคาท์', 'ส่วนลด']],
    sentences: [['How much is this?', 'ฮาว มัช ชิซ ดิส', 'อันนี้ราคาเท่าไหร่'], ["It's too expensive.", 'อิทส์ ทู อิก-สเปน-ซีฟ', 'แพงเกินไป'], ['Can I pay by card?', 'เคิน ไน เพย์ บาย คาร์ด', 'จ่ายด้วยบัตรได้ไหม']],
    patterns: [['pos', 'I buy fruit every week.', 'ไอ บาย ฟรูท เอฟ-วรี่ วีค', 'ฉันซื้อผลไม้ทุกสัปดาห์'], ['neg', "I don't need a bag.", 'ไอ โดนท์ นีด ดะ แบ็ก', 'ไม่ต้องใส่ถุงครับ'], ['q', 'Can I try this on?', 'เคิน ไน ทราย ดิส ออน', 'ขอลองใส่ได้ไหม'], ['past', 'I bought a new phone.', 'ไอ บอท ทะ นิว โฟน', 'ฉันซื้อโทรศัพท์ใหม่'], ['fut', 'I will pay by card.', 'ไอ วิล เพย์ บาย คาร์ด', 'ฉันจะจ่ายด้วยบัตร']],
    dialogs: [['How much is this?', 'ฮาว มัช ชิซ ดิส', 'อันนี้ราคาเท่าไหร่', "It's ten dollars.", 'อิทส์ เทน ดา-เลอร์ส', 'สิบดอลลาร์'],
              ['Can I pay by card?', 'เคิน ไน เพย์ บาย คาร์ด', 'จ่ายด้วยบัตรได้ไหม', 'Yes, of course.', 'เยส อะฟ คอร์ส', 'ได้เลย']] },
  { id: 'w1', unit: 'u3', title: 'นัดประชุม', icon: 'brief',
    words: [['meeting', 'มี-ดิ้ง', 'การประชุม'], ['schedule', 'สเก็จ-จูล', 'ตารางเวลา'], ['deadline', 'เดด-ไลน์', 'กำหนดส่ง'], ['task', 'ทาสก์', 'งานที่ต้องทำ'], ['update', 'อัพ-เดท', 'ความคืบหน้า / อัปเดต']],
    sentences: [['Can we meet tomorrow?', 'เคิน วี มีท ทะ-มา-โร่ว', 'พรุ่งนี้เจอกันได้ไหม'], ['The deadline is next Friday.', 'เดอะ เดด-ไลน์ อิซ เน็กซ์ ฟราย-เดย์', 'กำหนดส่งคือวันศุกร์หน้า'], ['I will send you an update.', 'ไอ วิล เซนด์ ยู แอน อัพ-เดท', 'ผมจะส่งความคืบหน้าให้']],
    patterns: [['pos', 'We meet every Monday.', 'วี มีท เอฟ-วรี่ มัน-เดย์', 'เราประชุมทุกวันจันทร์'], ['neg', "We don't have a meeting today.", 'วี โดนท์ แฮฟ วะ มี-ดิ้ง ทะ-เดย์', 'วันนี้เราไม่มีประชุม'], ['q', 'Can you join the meeting?', 'เคิน ยู จอยน์ เดอะ มี-ดิ้ง', 'เข้าร่วมประชุมได้ไหม'], ['past', 'I sent the report yesterday.', 'ไอ เซนท์ เดอะ รี-พอร์ท เยส-เตอร์-เดย์', 'ผมส่งรายงานไปเมื่อวาน'], ['fut', 'I will finish it by Friday.', 'ไอ วิล ฟิน-นิช ชิท บาย ฟราย-เดย์', 'ผมจะทำให้เสร็จภายในวันศุกร์']],
    dialogs: [['Can we meet tomorrow?', 'เคิน วี มีท ทะ-มา-โร่ว', 'พรุ่งนี้เจอกันได้ไหม', 'Sure, what time?', 'ชัวร์ วั้ท ไทม์', 'ได้ กี่โมงดี'],
              ['When is the deadline?', 'เวน อิซ เดอะ เดด-ไลน์', 'กำหนดส่งเมื่อไหร่', "It's next Friday.", 'อิทส์ เน็กซ์ ฟราย-เดย์', 'วันศุกร์หน้า']] },
  { id: 'w2', unit: 'u3', title: 'ปัญหาข้อมูล', icon: 'db',
    words: [['data', 'เด-ด้า', 'ข้อมูล'], ['problem', 'พรา-เบลิ้ม', 'ปัญหา'], ['fix', 'ฟิกซ์', 'แก้ไข'], ['check', 'เช็ค', 'ตรวจสอบ'], ['missing', 'มิส-ซิ่ง', 'หายไป / ขาด']],
    sentences: [['Some data is missing.', 'ซัม เด-ด้า อิซ มิส-ซิ่ง', 'ข้อมูลบางส่วนหายไป'], ['I will check the data.', 'ไอ วิล เช็ค เดอะ เด-ด้า', 'ผมจะตรวจสอบข้อมูล'], ['I need more time to fix it.', 'ไอ นีด มอร์ ไทม์ ทะ ฟิก ซิท', 'ผมต้องการเวลาเพิ่มเพื่อแก้']],
    patterns: [['pos', 'I check the data every day.', 'ไอ เช็ค เดอะ เด-ด้า เอฟ-วรี่ เดย์', 'ผมตรวจข้อมูลทุกวัน'], ['neg', 'The data is not correct.', 'เดอะ เด-ด้า อิซ นอท คะ-เร็คท์', 'ข้อมูลไม่ถูกต้อง'], ['q', 'Did you check the data?', 'ดิด จู เช็ค เดอะ เด-ด้า', 'ตรวจข้อมูลแล้วหรือยัง'], ['past', 'I fixed the problem.', 'ไอ ฟิกซ์ท เดอะ พรา-เบลิ้ม', 'ผมแก้ปัญหาแล้ว'], ['fut', 'I will fix it today.', 'ไอ วิล ฟิก ซิท ทะ-เดย์', 'ผมจะแก้ให้วันนี้']],
    dialogs: [['What is the problem?', 'วั้ท อิซ เดอะ พรา-เบลิ้ม', 'ปัญหาคืออะไร', 'Some data is missing.', 'ซัม เด-ด้า อิซ มิส-ซิ่ง', 'ข้อมูลบางส่วนหายไป'],
              ['Can you fix it today?', 'เคิน ยู ฟิก ซิท ทะ-เดย์', 'วันนี้แก้ได้ไหม', "Yes, I'll try my best.", 'เยส อายล์ ทราย มาย เบสท์', 'ได้ ผมจะพยายามเต็มที่']] },
  { id: 'w3', unit: 'u3', title: 'สัมภาษณ์งาน', icon: 'star',
    words: [['experience', 'อิก-สเปียร์-เรียนซ์', 'ประสบการณ์'], ['strength', 'สเตรงธ์', 'จุดแข็ง'], ['team', 'ทีม', 'ทีม'], ['skill', 'สกิล', 'ทักษะ'], ['role', 'โรล', 'ตำแหน่งงาน']],
    sentences: [["I'm a senior data engineer.", 'อาม มะ ซี-เนียร์ เด-ด้า เอน-จิ-เนียร์', 'ผมเป็นวิศวกรข้อมูลอาวุโส'], ['I enjoy solving problems.', 'ไอ เอน-จอย ซอล-วิ่ง พรา-เบลิ้มส์', 'ผมชอบแก้ปัญหา'], ['Thank you for your time.', 'แธง คิว เฟอร์ ยัวร์ ไทม์', 'ขอบคุณที่สละเวลา']],
    patterns: [['pos', 'I work with large data.', 'ไอ เวิร์ก วิธ ลาร์จ เด-ด้า', 'ผมทำงานกับข้อมูลขนาดใหญ่'], ['neg', "I don't have cloud experience.", 'ไอ โดนท์ แฮฟ คลาวด์ อิก-สเปียร์-เรียนซ์', 'ผมยังไม่มีประสบการณ์คลาวด์'], ['q', 'Do you work in a team?', 'ดู ยู เวิร์ก อิน นะ ทีม', 'คุณทำงานเป็นทีมไหม'], ['past', 'I worked on a tax project.', 'ไอ เวิร์คท์ ออน นะ แท็กซ์ พรา-เจ็คท์', 'ผมเคยทำโปรเจกต์ด้านภาษี'], ['fut', 'I will learn new skills.', 'ไอ วิล เลิร์น นิว สกิลส์', 'ผมจะเรียนรู้ทักษะใหม่']],
    dialogs: [['Tell me about yourself.', 'เทล มี อะ-เบ๊าท์ ยัวร์-เซลฟ์', 'เล่าเกี่ยวกับตัวคุณหน่อย', "I'm a senior data engineer.", 'อาม มะ ซี-เนียร์ เด-ด้า เอน-จิ-เนียร์', 'ผมเป็นวิศวกรข้อมูลอาวุโส'],
              ['What is your strength?', 'วั้ท อิซ ยัวร์ สเตรงธ์', 'จุดแข็งของคุณคืออะไร', 'I enjoy solving problems.', 'ไอ เอน-จอย ซอล-วิ่ง พรา-เบลิ้มส์', 'ผมชอบแก้ปัญหา']] },
  { id: 'w4', unit: 'u4', title: 'ETL และไปป์ไลน์', icon: 'pipe',
    words: [['pipeline', 'ไพพ์-ไลน์', 'ไปป์ไลน์ข้อมูล'], ['source', 'ซอร์ส', 'แหล่งข้อมูลต้นทาง'], ['load', 'โลด', 'โหลด / นำเข้า'], ['transform', 'แทรนส์-ฟอร์ม', 'แปลงข้อมูล'], ['batch', 'แบทช์', 'การประมวลผลเป็นชุด']],
    sentences: [['The pipeline failed last night.', 'เดอะ ไพพ์-ไลน์ เฟลด์ ลาสท์ ไนท์', 'ไปป์ไลน์ล้มเหลวเมื่อคืน'], ['We load data every hour.', 'วี โลด เด-ด้า เอฟ-วรี่ อาว-เอ่อร์', 'เราโหลดข้อมูลทุกชั่วโมง'], ['I will rerun the job.', 'ไอ วิล รี-รัน เดอะ จ็อบ', 'ผมจะรันงานใหม่อีกครั้ง']],
    patterns: [['pos', 'The job runs every night.', 'เดอะ จ็อบ รันส์ เอฟ-วรี่ ไนท์', 'งานรันทุกคืน'], ['neg', 'The job did not run.', 'เดอะ จ็อบ ดิด นอท รัน', 'งานไม่ได้รัน'], ['q', 'Does the job run daily?', 'ดัซ เดอะ จ็อบ รัน เดล-ลี่', 'งานรันทุกวันไหม'], ['past', 'The job failed last night.', 'เดอะ จ็อบ เฟลด์ ลาสท์ ไนท์', 'งานล้มเหลวเมื่อคืน'], ['fut', 'I will rerun it now.', 'ไอ วิล รี-รัน นิท นาว', 'ผมจะรันใหม่เดี๋ยวนี้']],
    dialogs: [['Did the job run successfully?', 'ดิด เดอะ จ็อบ รัน ซัก-เซส-ฟู-ลี่', 'งานรันสำเร็จไหม', 'No, it failed at the load step.', 'โน อิท เฟลด์ แอท เดอะ โลด สเต็พ', 'ไม่ มันล้มเหลวตอนขั้นโหลด'],
              ['Where does the data come from?', 'แวร์ ดัซ เดอะ เด-ด้า คัม ฟรัม', 'ข้อมูลมาจากไหน', 'It comes from three source systems.', 'อิท คัมส์ ฟรัม ธรี ซอร์ส ซิส-เต็มส์', 'มาจากระบบต้นทางสามระบบ']] },
  { id: 'w5', unit: 'u4', title: 'ฐานข้อมูลและ SQL', icon: 'db',
    words: [['table', 'เท-เบิ้ล', 'ตาราง'], ['column', 'คา-ลั่ม', 'คอลัมน์'], ['query', 'เคว-รี่', 'คำสั่งดึงข้อมูล'], ['duplicate', 'ดู-พลิ-เคท', 'ข้อมูลซ้ำ'], ['index', 'อิน-เด็กซ์', 'ดัชนี (ช่วยค้นหาเร็ว)']],
    sentences: [['The query is too slow.', 'เดอะ เคว-รี่ อิซ ทู สโลว์', 'คำสั่งดึงข้อมูลช้าเกินไป'], ['I found duplicate rows.', 'ไอ ฟาวนด์ ดู-พลิ-เคท โรวส์', 'ผมเจอแถวที่ซ้ำ'], ['Let me add an index.', 'เล็ม มี แอด แดน อิน-เด็กซ์', 'ขอเพิ่มดัชนีก่อนนะ']],
    patterns: [['pos', 'This query joins two tables.', 'ดิส เคว-รี่ จอยน์ส ทู เท-เบิ้ลส์', 'คำสั่งนี้เชื่อมสองตาราง'], ['neg', 'This column has no data.', 'ดิส คา-ลั่ม แฮซ โน เด-ด้า', 'คอลัมน์นี้ไม่มีข้อมูล'], ['q', 'Is this table updated daily?', 'อิซ ดิส เท-เบิ้ล อัพ-เด-ทิด เดล-ลี่', 'ตารางนี้อัปเดตทุกวันไหม'], ['past', 'I removed the duplicate rows.', 'ไอ รี-มูฟด์ เดอะ ดู-พลิ-เคท โรวส์', 'ผมลบแถวที่ซ้ำแล้ว'], ['fut', 'I will tune the query.', 'ไอ วิล ทูน เดอะ เคว-รี่', 'ผมจะปรับคำสั่งให้เร็วขึ้น']],
    dialogs: [['Why is the report slow?', 'วาย อิซ เดอะ รี-พอร์ท สโลว์', 'ทำไมรายงานช้า', 'The query scans the whole table.', 'เดอะ เคว-รี่ สแกนส์ เดอะ โฮล เท-เบิ้ล', 'คำสั่งสแกนทั้งตาราง'],
              ['How many rows are there?', 'ฮาว เม-นี่ โรวส์ อาร์ แดร์', 'มีกี่แถว', 'About two million rows.', 'อะ-เบ๊าท์ ทู มิล-เลี่ยน โรวส์', 'ประมาณสองล้านแถว']] },
  { id: 'w6', unit: 'u4', title: 'รายงานและแดชบอร์ด', icon: 'chart',
    words: [['report', 'รี-พอร์ท', 'รายงาน'], ['dashboard', 'แดช-บอร์ด', 'แดชบอร์ด'], ['total', 'โท-เทิ่ล', 'ยอดรวม'], ['increase', 'อิน-ครีส', 'เพิ่มขึ้น'], ['decrease', 'ดี-ครีส', 'ลดลง']],
    sentences: [['Sales increased this month.', 'เซลส์ อิน-ครีสท์ ดิส มันธ์', 'ยอดขายเพิ่มขึ้นเดือนนี้'], ['The numbers do not match.', 'เดอะ นัม-เบอร์ส ดู นอท แมทช์', 'ตัวเลขไม่ตรงกัน'], ['I will update the dashboard.', 'ไอ วิล อัพ-เดท เดอะ แดช-บอร์ด', 'ผมจะอัปเดตแดชบอร์ด']],
    patterns: [['pos', 'The report shows monthly sales.', 'เดอะ รี-พอร์ท โชวส์ มันธ์-ลี่ เซลส์', 'รายงานแสดงยอดขายรายเดือน'], ['neg', 'The total does not match.', 'เดอะ โท-เทิ่ล ดัซ นอท แมทช์', 'ยอดรวมไม่ตรงกัน'], ['q', 'Can you send me the report?', 'เคิน ยู เซนด์ มี เดอะ รี-พอร์ท', 'ส่งรายงานให้หน่อยได้ไหม'], ['past', 'Sales decreased last month.', 'เซลส์ ดี-ครีสท์ ลาสท์ มันธ์', 'ยอดขายลดลงเดือนที่แล้ว'], ['fut', 'I will add a new chart.', 'ไอ วิล แอด ดะ นิว ชาร์ท', 'ผมจะเพิ่มกราฟใหม่']],
    dialogs: [['Is the dashboard ready?', 'อิซ เดอะ แดช-บอร์ด เร-ดี้', 'แดชบอร์ดพร้อมหรือยัง', 'Yes, I sent you the link.', 'เยส ไอ เซนท์ ยู เดอะ ลิงก์', 'พร้อมแล้ว ส่งลิงก์ไปให้แล้ว'],
              ["Why don't the numbers match?", 'วาย โดนท์ เดอะ นัม-เบอร์ส แมทช์', 'ทำไมตัวเลขไม่ตรงกัน', 'Some records are missing.', 'ซัม เร-เคิร์ดส์ อาร์ มิส-ซิ่ง', 'ข้อมูลบางรายการหายไป']] },
  { id: 'w7', unit: 'u4', title: 'คลาวด์', icon: 'cloud',
    words: [['cloud', 'คลาวด์', 'คลาวด์'], ['storage', 'สตอ-เร็จ', 'พื้นที่จัดเก็บ'], ['cost', 'คอสท์', 'ค่าใช้จ่าย'], ['migrate', 'ไม-เกรท', 'ย้ายระบบ'], ['secure', 'ซิ-เคียวร์', 'ปลอดภัย']],
    sentences: [['We plan to migrate to the cloud.', 'วี แพลน ทะ ไม-เกรท ทะ เดอะ คลาวด์', 'เราวางแผนย้ายระบบขึ้นคลาวด์'], ['The storage cost is high.', 'เดอะ สตอ-เร็จ คอสท์ อิซ ไฮ', 'ค่าพื้นที่จัดเก็บสูง'], ["I'm learning Databricks.", 'อาม เลิร์น-นิ่ง เด-ด้า-บริกส์', 'ผมกำลังเรียน Databricks']],
    patterns: [['pos', 'We store files in the cloud.', 'วี สตอร์ ไฟลส์ อิน เดอะ คลาวด์', 'เราเก็บไฟล์บนคลาวด์'], ['neg', "We don't use the cloud yet.", 'วี โดนท์ ยูส เดอะ คลาวด์ เยท', 'เรายังไม่ได้ใช้คลาวด์'], ['q', 'How much does it cost?', 'ฮาว มัช ดัซ ซิท คอสท์', 'ค่าใช้จ่ายเท่าไหร่'], ['past', 'We migrated the database last year.', 'วี ไม-เกร-ทิด เดอะ เด-ด้า-เบส ลาสท์ เยียร์', 'ปีที่แล้วเราย้ายฐานข้อมูล'], ['fut', 'We will move to Databricks.', 'วี วิล มูฟ ทะ เด-ด้า-บริกส์', 'เราจะย้ายไปใช้ Databricks']],
    dialogs: [['Have you used Microsoft Fabric?', 'แฮฟ ยู ยูสด์ ไมโคร-ซอฟท์ แฟบ-ริก', 'เคยใช้ Microsoft Fabric ไหม', "Not yet, but I'm learning it.", 'นอท เยท บัท อาม เลิร์น-นิ่ง งิท', 'ยังครับ แต่กำลังเรียนอยู่'],
              ['Is the data secure?', 'อิซ เดอะ เด-ด้า ซิ-เคียวร์', 'ข้อมูลปลอดภัยไหม', 'Yes, access is controlled by role.', 'เยส แอค-เซส อิซ คอน-โทรลด์ บาย โรล', 'ปลอดภัย สิทธิ์เข้าถึงกำหนดตามบทบาท']] }
];

function starsFor_(pct) { return pct >= 90 ? 3 : pct >= 75 ? 2 : pct >= 60 ? 1 : 0; }

function lessonProgress_(user) {
  ensureSheet_(getSS_(), SHEET_LP, ['user', 'lesson_id', 'best_pct', 'stars', 'updated_at'], []);
  const map = {};
  readTable_(SHEET_LP).forEach(r => { if (String(r[0]) === user) map[String(r[1])] = { best: Number(r[2]), stars: Number(r[3]) }; });
  return map;
}

// รายการบทเรียนทั้งหมด + ความคืบหน้าของผู้ใช้
function getLessons(token) {
  const user = requireUser_(token);
  const prog = lessonProgress_(user);
  let prevPassed = true;
  const lessons = LESSONS.map((l, i) => {
    const p = prog[l.id] || { best: 0, stars: 0 };
    const out = {
      id: l.id, unit: l.unit, no: i + 1, title: l.title, icon: l.icon,
      words: l.words.map(w => ({ en: w[0], rd: w[1], th: w[2], emoji: emojiFor_(w[0]) })),
      sentences: l.sentences.map(s => ({ en: s[0], rd: s[1], th: s[2] })),
      patterns: (l.patterns || []).map(p => ({ type: p[0], en: p[1], rd: p[2], th: p[3] })),
      dialogs: l.dialogs.map(d => ({ q: d[0], qr: d[1], qt: d[2], a: d[3], ar: d[4], at: d[5] })),
      best: p.best, stars: p.stars, locked: !prevPassed
    };
    prevPassed = p.stars > 0;
    return out;
  });
  return { units: UNITS, lessons: lessons };
}

// บันทึกผลสอบ (เก็บคะแนนที่ดีที่สุด) ถ้าผ่านจะนับคำในบทเป็น "ฝึกแล้ว"
function submitLesson(token, lessonId, correct, total) {
  const user = requireUser_(token);
  const lesson = LESSONS.find(l => l.id === lessonId);
  if (!lesson) throw new Error('ไม่พบบทเรียนนี้');
  total = Math.max(1, Number(total) || 1);
  correct = Math.max(0, Math.min(total, Number(correct) || 0));
  const pct = Math.round(correct / total * 100);
  const stars = starsFor_(pct);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    lessonProgress_(user);
    const sh = getSS_().getSheetByName(SHEET_LP);
    const rows = readTable_(SHEET_LP);
    const i = rows.findIndex(r => String(r[0]) === user && String(r[1]) === lessonId);
    const prevBest = i >= 0 ? Number(rows[i][2]) : 0;
    if (i < 0) sh.appendRow([user, lessonId, pct, stars, new Date()]);
    else if (pct > prevBest) sh.getRange(i + 2, 3, 1, 3).setValues([[pct, stars, new Date()]]);

    if (stars > 0) {
      const learned = learnedSet_(user);
      const now = new Date();
      const add = lesson.words.map(w => ['w:' + w[0], 'word'])
        .concat(lesson.sentences.map(s => ['s:' + s[0], 'sentence']))
        .filter(x => !learned.has(x[0]))
        .map(x => [x[0], x[1], now, user]);
      if (add.length) {
        const ps = getSS_().getSheetByName(SHEET_PROG);
        ps.getRange(ps.getLastRow() + 1, 1, add.length, 4).setValues(add);
      }
    }
    const idx = LESSONS.findIndex(l => l.id === lessonId);
    return {
      pct: pct, stars: stars, best: Math.max(pct, prevBest), passed: stars > 0,
      newBest: pct > prevBest, next: stars > 0 && LESSONS[idx + 1] ? LESSONS[idx + 1].id : null,
      stats: getStats_(user, learnedSet_(user))
    };
  } finally {
    lock.releaseLock();
  }
}
