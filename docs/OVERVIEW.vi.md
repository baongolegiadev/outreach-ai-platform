<!--
DOCUMENT METADATA
Owner: @project-manager
Purpose: Giải thích nhanh cho người mới về dự án, flow nghiệp vụ, và ý nghĩa các bảng chính.
Last updated: 2026-04-17
-->

# Tổng quan dự án (Vietnamese)

## Dự án này là gì?

**Outreach AI Platform** là một nền tảng SaaS giúp **sales/SDR/founder** thực hiện **outbound email** (cold email) theo **chuỗi (sequence/campaign)** ở mức “dùng được hàng ngày”, không phải demo.

Nó tập trung vào 3 việc chính:

- **Quản lý lead** (người nhận email): nhập tay, import CSV, gắn tag, tìm kiếm/lọc.
- **Thiết kế sequence**: nhiều bước email theo thứ tự, có **độ trễ (delay)** giữa các bước, mỗi bước có template.
- **Enroll lead vào sequence**: tạo các bản ghi “đang chạy” để hệ thống (worker/queue) có thể gửi email đúng thời điểm, retry, rate-limit, theo dõi phản hồi (các phần này thuộc các task tiếp theo).

> Dự án là **multi-tenant**: mỗi “công ty/nhóm” là một **Workspace**. Mọi dữ liệu nghiệp vụ đều **workspace-scoped**.

---

## Kiến trúc tổng quan

Stack (tóm tắt):

- **Web**: Next.js (App Router) — UI
- **API**: NestJS — auth + business logic
- **DB**: PostgreSQL (Supabase) + Prisma
- **Queue/Workers**: (đang phát triển qua các task tiếp theo)

Luồng gọi API:

1. Client login → nhận **JWT**
2. Khi gọi các route “workspace-scoped”, client luôn gửi thêm header:
   - `Authorization: Bearer <JWT>`
   - `x-workspace-id: <workspace_uuid>`

---

## Flow nghiệp vụ end-to-end (từ lead đến gửi email)

### 1) Tạo lead

Lead là người sẽ nhận email. Bạn có thể:

- Tạo lead qua API/UI (CRUD)
- Import CSV (task `008`) để đổ dữ liệu hàng loạt kèm **validation report**

### 2) Tạo sequence (campaign)

Sequence là “chiến dịch” gồm nhiều **step**.

### 3) Tạo steps cho sequence

Mỗi step có:

- **stepOrder**: thứ tự 0,1,2…
- **delayMinutes**: số phút chờ sau bước trước
  - Bước 0 có thể là 0
  - Bước > 0 phải **>= 1** (rule server-side)
- **subject/body template**:
  - hỗ trợ `{{first_name}}`
  - hỗ trợ `{{company}}`

### 4) Enroll leads vào sequence

Khi enroll, hệ thống tạo các bản ghi **SequenceEnrollment** để biết:

- lead nào đang chạy sequence nào
- trạng thái hiện tại (active/completed/stopped)
- thời điểm đến hạn gửi tiếp (`nextSendAt`) để worker/queue quét và gửi

---

## Các bảng (tables) và vai trò của từng bảng

Phần này mô tả “mục đích tồn tại” của từng bảng — để bạn hiểu nhanh dữ liệu nằm ở đâu.

### 1) User

- **Mục đích**: tài khoản đăng nhập (identity)
- **Điểm chính**: `email` unique toàn hệ thống, có `passwordHash`
- **Quan hệ**: User tham gia nhiều workspace thông qua `Membership`

### 2) Workspace

- **Mục đích**: ranh giới tenant (dữ liệu của công ty/nhóm)
- **Quan hệ**: Workspace có nhiều leads/tags/sequences/enrollments…

### 3) Membership

- **Mục đích**: map User ↔ Workspace + role
- **Role**: `ADMIN` / `MEMBER`
- **Ý nghĩa**: mọi route workspace-scoped đều phải qua kiểm tra membership

---

### 4) Lead

- **Mục đích**: contact sẽ nhận email
- **Unique**: `(workspaceId, email)` để không trùng email trong 1 workspace
- **Quan hệ**:
  - Lead ↔ Tag qua `LeadTag`
  - Lead ↔ Sequence qua `SequenceEnrollment`

### 5) Tag

- **Mục đích**: nhãn phân loại lead
- **Unique**: `(workspaceId, name)`

### 6) LeadTag

- **Mục đích**: bảng nối nhiều-nhiều giữa `Lead` và `Tag`

---

### 7) Sequence

- **Mục đích**: campaign/chuỗi email trong workspace
- **Chứa**: tên sequence và quan hệ tới steps/enrollments

### 8) SequenceStep

- **Mục đích**: định nghĩa từng bước của sequence
- **Trường quan trọng**:
  - `stepOrder` + `delayMinutes`
  - `subject` + `body` (template)
- **Unique**: `(sequenceId, stepOrder)` để đảm bảo thứ tự rõ ràng

### 9) SequenceEnrollment

- **Mục đích**: bản ghi “lead đang chạy sequence”
- **Trường quan trọng**:
  - `status`: `ACTIVE | COMPLETED | STOPPED`
  - `currentStep`: con trỏ step hiện tại
  - `nextSendAt`: thời điểm đến hạn gửi (phục vụ worker/queue scanning)
- **Unique**: `(sequenceId, leadId)` để tránh enroll trùng
- **Index cho queue scanning**:
  - `(workspaceId, status, nextSendAt)` giúp query kiểu “lấy job đến hạn” chạy nhanh

---

## Task đã làm trong repo (liên quan hiện tại)

- **Task 008**: Import leads từ CSV + validation report + giới hạn upload
- **Task 009**: Sequences API: CRUD sequence/step + enroll leads theo batch + validate delay + merge fields

---

## Gợi ý bạn test nhanh

- Test import lead CSV (task 008): `scripts/test-leads-csv-import.sh`
- Test sequences end-to-end (task 009): `scripts/test-sequences-api.sh`
  - Nếu enroll fail vì leadId không tồn tại: chạy với `AUTO_CREATE_LEAD=1` để script tự tạo 1 lead test rồi enroll.

