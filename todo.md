# Dormitory Management System - TODO

## Database & Backend
- [x] Database schema: buildings, floors, rooms, tenants, meter_readings, bills, bill_items, payments, bill_edit_history
- [x] tRPC routers: rooms, tenants, meters, bills, payments, reports
- [x] Role-based access: admin (owner) vs user (tenant)
- [x] Bill calculation logic (monthly/daily rooms)
- [x] Meter validation (new reading >= old reading)
- [x] Duplicate bill detection per period

## Frontend - Admin (Owner) Side
- [x] Global theme: Typographic Brutalist (black/white, heavy sans-serif, geometric lines)
- [x] DashboardLayout with sidebar navigation (Thai labels)
- [x] Dashboard page: stats cards (total rooms, vacant, occupied, daily, monthly, unpaid bills, monthly income)
- [x] Room management page: list, add, edit, delete rooms (type, price, water rate, electricity rate, deposit, status)
- [x] Tenant management page: list, add, edit, delete tenants (personal info, linked room, contract dates, deposit)
- [x] Meter reading page: record water/electricity meters, OCR camera button, validation
- [x] Bill management page: create bills (auto-calculate), list bills, filter by status
- [x] Bill detail page: view/edit bill items, QR Code PromptPay, print/PDF, status update
- [x] Bill edit history tracking
- [x] Reports page: monthly income, unpaid list, bill list

## Frontend - Tenant Side
- [x] Tenant portal: login, view own room info
- [x] Tenant dashboard: current bill, payment status, history
- [x] Tenant bill detail: view bill, submit payment slip
- [x] Tenant meter history view (included in Reports meter tab)

## Features
- [x] QR Code PromptPay generation on bills
- [x] OCR meter reading (camera capture + LLM vision)
- [x] Print bill (browser print)
- [x] Payment status update (paid/partial/unpaid/pending)
- [x] Bill period duplicate detection with warning
- [x] Bill edit audit trail (who, what, when)
- [x] Responsive mobile-first design
- [x] PDF bill export (server-side PDFKit generation with QR Code)
- [ ] LINE/Email notification (future enhancement - requires LINE API key setup)

## Testing
- [x] Vitest tests for role-based access
- [x] Vitest tests for bill router (list, getById, reports)
- [x] Vitest tests for auth logout

## Backlog / Future Improvements
- [x] PDF bill export (server-side PDFKit + browser print)
- [x] Reports: expand to include meter history and bill edit history tabs
- [x] Dedicated tenant bill detail page (/portal/bills/:id) with QR
- [ ] LINE/Email notification when bill is created or due (future)
- [ ] Scheduled auto-generate monthly bills (future)
- [x] RBAC test suite covering key procedures (rooms, reports, dashboard, auth)
- [x] Dashboard stats unit tests (property verification, role checks)

## User Requested Changes
- [x] เพิ่มตัวเลือกค่าน้ำเหมาจ่าย (flat rate water) ในห้องพัก: ให้เลือกได้ว่าจะคิดค่าน้ำแบบตามมิเตอร์หรือเหมาจ่าย
- [x] เพิ่มโลโก้ Open Graph (OG image) สำหรับแชร์ลิงก์ในมือถือ (LINE, Facebook, etc.)
- [x] เปลี่ยนชื่อแอปเป็น HorPakMax ทั้ง title, OG tags, และ Landing page
- [x] ปรับหน้า Login ให้แยกปุ่มเข้าสู่ระบบ 2 กลุ่ม: ผู้เช่า และ เจ้าของ/แอดมิน
- [x] เพิ่มหน้า Settings (ตั้งค่า) ในเมนู sidebar: จัดการแอดมินและผู้เช่า (ดูรายชื่อ, เปลี่ยน role, แก้ไขข้อมูล)
- [x] เพิ่มส่วนตั้งค่าชื่อหอพักในหน้า Settings (บันทึกลง DB, แสดงใน sidebar/header)
- [x] BUG: กรอกห้องพักแล้วไม่บันทึก - แก้ไขแล้ว (sanitize empty strings to null)
- [x] เพิ่ม regression test สำหรับ rooms.create/rooms.update กรณีช่องตัวเลขว่าง
- [x] เพิ่ม error handling UI ที่ชัดเจนเมื่อบันทึกล้มเหลว (toast จาก server message)
- [x] BUG: เพิ่มผู้เช่าไม่ได้ - แก้แล้ว (sanitize empty strings)
- [x] เปลี่ยนชื่อแอปเวลาแชร์/โหลดลงหน้าโฮมมือถือเป็น "หอพักโปร" (OG tags, PWA manifest, title)
- [x] จำกัดจำนวนแอดมินสูงสุด 3 คน (ตรวจสอบก่อนเปลี่ยน role เป็น admin)
- [x] เพิ่มเลขมิเตอร์ก่อน-หลังในบิล (bills) เพื่อให้ผู้เช่าดูได้ชัดเจน
- [ ] BUG: โลโก้ favicon/PWA icon สีดำหายเมื่อเพิ่มลงหน้าโฮมมือถือ - สร้างไอคอนใหม่ที่มีพื้นหลังสีขาว
