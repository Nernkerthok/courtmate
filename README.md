# CourtMate — ตีด้วยกัน

เว็บจัดก๊วนแบดมินตันสำหรับมือถือ ใช้ **React + TypeScript + Tailwind CSS** และแยก **Laravel 13 API** สำหรับโหมดเซิร์ฟเวอร์ ไม่ใช้ฐานข้อมูล ไม่สมัครสมาชิก และไม่บันทึกรายชื่อหรือเกม

## ใช้งาน

1. ตั้งชื่อก๊วน เพิ่มชื่อเล่น และเลือก Level 1–5 อย่างน้อย 4 คน (สูงสุด 40 คน)
2. เลือก Auto หรือ Custom จัดประเภทคู่ 1–5 คอร์ท คนหนึ่งลงได้คอร์ทเดียวต่อรอบ
3. กด **จบเกมนี้** หลังเล่นจริง จำนวนเกมของผู้เล่นทั้ง 4 คนจึงเพิ่ม สามารถย้อนเกมล่าสุดเมื่อกดผิด
4. กรอกชั่วโมง จำนวนคอร์ท ราคาสนามต่อคอร์ทต่อชั่วโมง ค่าลูกแบด และรายการอื่น ๆ
5. คำนวณ ตรวจตาราง แล้วสร้างรูป PNG เพื่อดาวน์โหลดหรือแชร์ผ่านเมนูแชร์ของอุปกรณ์

ข้อมูลอยู่ใน React memory เท่านั้น รีเฟรช ปิดหน้า หรือปิดเบราว์เซอร์แล้วเริ่มใหม่ ไม่มี localStorage, sessionStorage, cookies ของแอป หรือฐานข้อมูล รูปสรุปถูกสร้างบนเครื่องและจะดาวน์โหลด/แชร์เมื่อผู้ใช้กดเท่านั้น โหมด GitHub Pages ไม่ส่งข้อมูลผู้เล่นออกจากเบราว์เซอร์

## หลักการจับคู่และคิดเงิน

- Auto เลือกคนที่พร้อมเล่นและมีจำนวนเกมน้อยก่อน สุ่มเมื่อเกมเท่ากัน แล้วจับคู่ Level สูง+ต่ำ พบคู่ที่เหลือภายในคอร์ท ไม่รับประกันว่าไม่เจอคู่เดิมหรือมีเวลาเล่นเท่ากัน
- Custom เลือกผู้เล่นแต่ละตำแหน่งเอง ป้องกันชื่อซ้ำข้ามทีมและข้ามคอร์ท
- ปิดพร้อมเล่นเมื่อพัก ต้องจบคอร์ทที่กำลังเล่นก่อนจัดรอบใหม่หรือเปลี่ยนรายชื่อ
- **ค่าสนามรวม = ชั่วโมง × จำนวนคอร์ท × ราคาต่อคอร์ทต่อชั่วโมง** รองรับชั่วโมงทีละ 0.25 (15 นาที)
- **ยอดต่อคน = ค่าใช้จ่ายรวม × เกมที่คนนั้นเล่น ÷ ผลรวมเกมของทุกคน** ใช้สูตรเดียวกันกับทุกรายการ คนเล่น 0 เกมจ่าย 0 บาท
- คิดเป็นสตางค์และกระจายเศษด้วยวิธี largest remainder เพื่อให้ยอดรายคนรวมตรงกับยอดจริง เศษเท่ากันให้ตามลำดับเพิ่มรายชื่อ
- จำนวนเกมไม่ใช่เวลาเล่นจริง และเวอร์ชันนี้ยังไม่มีการคิดราคาพิเศษรายคนหรือแยกชั่วโมงตามแต่ละคอร์ท

## เปิดบนเครื่อง

Node.js 22 LTS แนะนำ (ตรวจบน Node 20.7 ได้ด้วย)

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## GitHub Pages

Repo: [Nernkerthok/courtmate](https://github.com/Nernkerthok/courtmate)

ใช้โฟลเดอร์นี้เป็น root ของ repo มี workflow `.github/workflows/pages.yml` ทดสอบ frontend และ Laravel ตรวจ dependency และเผยแพร่ `dist` เมื่อ push สู่ `main`

ตั้งค่า **Settings → Pages → Source → GitHub Actions** แล้วรอ workflow สำเร็จ หน้าเว็บใช้ asset path แบบ relative จึงเปิดใต้ `/courtmate/` ได้ ไม่ต้องมี server-side routing

GitHub Pages โฮสต์เฉพาะ frontend; ไม่รัน PHP/Laravel เวอร์ชันทดลองจึงคำนวณบนเครื่องโดยค่าเริ่มต้น Laravel อยู่ใน repo สำหรับการใช้งานบนเซิร์ฟเวอร์ภายหลัง ไม่ต้องเปิด API เพื่อทดลองผ่าน Pages

## Laravel API (ไม่จำเป็นสำหรับ GitHub Pages)

PHP **8.3+**, Composer 2 และ PHP extensions ตามเอกสาร Laravel 13 ใช้ PHP 8.3+ จาก PATH ไม่ใช่ PHP 7.4 เดิมของ MAMP

```sh
cd backend
php prepare.php
composer install
cp .env.example .env
php artisan key:generate
composer test
php artisan serve --host=127.0.0.1 --port=8000
```

บน Windows ใช้ `Copy-Item .env.example .env` แทน `cp` ได้ `prepare.php` สร้างโฟลเดอร์ runtime ที่ถูกละไว้จาก Git

ตั้ง `VITE_USE_API=true` ใน `.env.local` ที่ root แล้วเริ่ม Vite ใหม่ `/api` จะส่งต่อไป Laravel ที่ `127.0.0.1:8000` โดยหน้าเว็บกับ API เป็น origin เดียวกัน ไม่เปิด CORS ทั่วโลก

API `POST /api/settlements` รับเฉพาะรายชื่อ/เกมและค่าใช้จ่ายที่ผ่าน validation แล้วคืนตาราง ไม่มีฐานข้อมูล ไม่มี endpoint อัปโหลด บันทึก ลบข้อมูล หรือเรียก shell ใช้ชุดทดสอบค่าเงินเดียวกับ frontend

```json
{
  "players": [{"id":1,"name":"ต้น","games":2},{"id":2,"name":"มิน","games":1}],
  "costs": {"minutes":120,"courts":1,"courtRateCents":20000,"shuttleCostCents":10000,"extras":[]}
}
```

ชื่อและข้อมูลส่งไป API เฉพาะเมื่อเปิดโหมดนี้ ไม่มีการบันทึก body ของคำขอ ตัวจำกัดความถี่เก็บเพียงตัวนับชั่วคราวตาม IP ใน cache; สำหรับทดสอบใช้ cache แบบ memory

## ความปลอดภัยและการเผยแพร่

- ตรวจความยาว จำนวนคน จำนวนเกม และตัวเลขทั้ง frontend และ API จำกัดขนาดคำขอ 128 KiB และ API 30 ครั้ง/นาที/IP
- React escape ข้อความตามปกติ ไม่ใช้ raw HTML, eval หรือ render เนื้อหาผู้ใช้เป็นคำสั่ง ภาพสร้างผ่าน Canvas ไม่ใช้ HTML จากผู้ใช้
- Bundle ฟอนต์และ Tailwind ในไฟล์ของเว็บ ไม่เรียก CDN/analytics และไม่มี secrets ใน frontend
- Production HTML มี Content Security Policy จำกัดแหล่ง script/font/connect ไว้ที่ origin เดียวกัน ไม่อนุญาต inline scripts; โหมด dev เอา meta นี้ออกเฉพาะเพื่อให้ Vite HMR ทำงาน
- API ส่ง no-store, nosniff, DENY และปิด debug โดยค่าเริ่มต้น อย่าใส่ token, `.env`, `vendor`, `node_modules` หรือข้อมูลจริงใน Git
- Deploy Laravel โดยให้ document root เป็น **backend/public** เท่านั้น ใช้ HTTPS, `APP_DEBUG=false`, สร้าง `APP_KEY` บนเซิร์ฟเวอร์ จำกัด request body ที่ web server และ reverse-proxy `/api` จาก origin ของ frontend
- อย่า expose โฟลเดอร์ project/backend/vendor หรือใช้ PHP dev server บนอินเทอร์เน็ต ตั้ง trusted proxies ให้ตรงกับโครงสร้างที่ใช้จริง
- ตรวจ `npm audit --audit-level=high` และ `composer audit` ก่อน release และอัปเดต dependencies ต่อเนื่อง ไม่มีระบบใดรับประกันว่าปลอดการโจมตี 100%
- แชร์ไฟล์โดย Web Share API ต้องใช้อุปกรณ์/เบราว์เซอร์ที่รองรับและ HTTPS หากไม่รองรับจะดาวน์โหลด PNG ให้แนบในแชทเอง

## การตรวจเวอร์ชันนี้

- 12 frontend domain tests: ความเป็นธรรมของคิว, ทีมไม่ซ้ำ, การเพิ่มเกม, คนไม่ได้เล่น และการกระจายเศษเงิน
- API HTTP tests: ใช้ชุดข้อมูลเดียวกัน ตรวจ validation, rate limit, วิธี HTTP และ no-store โดยไม่ใช้ฐานข้อมูล
- ทดสอบผ่านเบราว์เซอร์บนหน้าจอมือถือ: Auto, Custom, จบเกม, ค่าใช้จ่ายเพิ่มเติม และดาวน์โหลด PNG
- ไม่ได้ส่งรูปให้บุคคลอื่นระหว่างทดสอบ ปุ่มแชร์จะให้ผู้ใช้เลือกปลายทางเอง

อ้างอิง: [Tailwind + Vite](https://tailwindcss.com/docs/installation/using-vite), [Laravel Deployment](https://laravel.com/docs/13.x/deployment), [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
