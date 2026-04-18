<!--
DOCUMENT METADATA
Owner: @project-manager
Purpose: Giải thích nhanh cho người mới về dự án, flow nghiệp vụ, và ý nghĩa các bảng chính.
Last updated: 2026-04-19
-->

# Tổng quan dự án (Vietnamese)

## Dự án này là gì?

**Outreach AI Platform** là một nền tảng SaaS giúp **sales/SDR/founder** thực hiện **outbound email** (cold email) theo **chuỗi (sequence/campaign)** ở mức “dùng được hàng ngày”, không phải demo.

Nó tập trung vào 3 việc chính:

- **Quản lý lead** (người nhận email): nhập tay, import CSV, gắn tag, tìm kiếm/lọc.
- **Thiết kế sequence**: nhiều bước email theo thứ tự, có **độ trễ (delay)** giữa các bước, mỗi bước có template.
- **Enroll + dispatch outbound**: tạo bản ghi “đang chạy”, đưa job vào queue, worker gửi async theo rate limit/retry/dead-letter.

> Dự án là **multi-tenant**: mỗi “công ty/nhóm” là một **Workspace**. Mọi dữ liệu nghiệp vụ đều **workspace-scoped**.

---

## Kiến trúc tổng quan

Stack (tóm tắt):

- **Web**: Next.js (App Router) — UI
- **API**: NestJS — auth + business logic
- **DB**: PostgreSQL (Supabase) + Prisma
- **Queue/Workers**: DB-backed queue trong API process (polling worker)

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

### 5) Dispatch async (HTTP 202) + worker xử lý

Khi gọi endpoint dispatch:

- API **không gửi email trực tiếp** trong request đó
- API trả `202 Accepted` và tạo `OutboundMessageJob` (status `QUEUED`)
- Worker nền quét job đến hạn, gửi qua adapter (SMTP / Gmail stub), rồi ghi result

### 6) Retry, rate-limit, dead-letter

- **Rate limit theo inbox identity**: tránh burst quá ngưỡng/phút.
- **Retry exponential backoff** cho lỗi tạm thời (ít nhất 3 lần).
- Quá số lần retry thì job chuyển `DEAD_LETTER` để operator nhìn thấy.

### 7) Theo dõi mở email (open tracking) — task #012

**Mục đích**: biết **email đã gửi có được mở hay không** (mức độ xấp xỉ), để:

- Tính **open rate** và các chỉ số analytics sau này (dashboard task #014).
- Ghi nhận hoạt động **“email opened”** trong hệ thống (FR-080; tới task #016 sẽ có activity log thống nhất).

**Cách hoạt động (v1)**:

- Mỗi `OutboundMessageJob` có **`openTrackingToken`** ngẫu nhiên (khó đoán).
- Worker khi gửi mail sẽ chèn vào HTML một **pixel ảnh GIF trong suốt 1×1**; URL trỏ tới API công khai **`GET /track/opens/:token`** (không cần JWT, không nằm dưới prefix `/v1`).
- Lần **đầu tiên** client mở ảnh (thường là khi người nhận bật tải ảnh trong email), server ghi **`openedAt`** và một event **`OPENED`** — các lần sau **không tạo thêm** (idempotent).

**Cần hiểu đúng giới hạn**:

- Người dùng tắt ảnh / Apple Mail Privacy / bot quét link có thể làm số liệu **lệch** — đây là giới hạn chung của pixel, không phải “đã đọc chắc chắn”.
- Sự kiện từ nhà cung cấp email (ESP) có thể bổ sung sau; v1 ưu tiên pixel + ghi DB đơn giản (ADR-003).

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

### 10) OutboundMessageJob

- **Mục đích**: hàng đợi gửi email outbound được persist trong DB.
- **Trường quan trọng**:
  - `status`: `QUEUED | PROCESSING | SENT | DEAD_LETTER`
  - `attemptCount`, `maxAttempts`, `nextAttemptAt`
  - `inboxIdentity`, `toEmail`, `subject`, `htmlBody`
  - **`openTrackingToken`**: token dùng trong URL pixel mở email (task #012).
  - **`openedAt`**: thời điểm ghi nhận **lần mở đầu tiên** (nếu có).
- **Unique**: `(sequenceEnrollmentId, sequenceStepId)` tránh queue trùng cho cùng enrollment-step; `openTrackingToken` unique khi có giá trị.

### 11) OutboundMessageAttempt

- **Mục đích**: lịch sử từng lần thử gửi (success/fail, transient/non-transient).
- Dùng cho debug, analytics, và audit retry behavior.

### 12) OutboundMessageEvent

- **Mục đích**: log event nghiệp vụ mức job:
  - `QUEUED`
  - `SENT`
  - `RETRY_SCHEDULED`
  - `DEAD_LETTER`
  - **`OPENED`**: email được mở (theo pixel), tối đa một lần ghi có ý nghĩa cho “first open” (task #012).

---

## Task đã làm trong repo (liên quan hiện tại)

- **Task 008**: Import leads từ CSV + validation report + giới hạn upload
- **Task 009**: Sequences API: CRUD sequence/step + enroll leads theo batch + validate delay + merge fields
- **Task 011**: Outbound mailer queue: dispatch `202`, worker async, adapter SMTP + Gmail stub, rate limit, retry/backoff, dead-letter
- **Task 012**: Open tracking: pixel trong email + endpoint công khai `GET /track/opens/:token`, ghi `openedAt` + event `OPENED` (lần đầu), phục vụ analytics/activity — chi tiết kỹ thuật & hạn chế privacy/bot: `docs/technical/OPEN_TRACKING.md`

---

## Gợi ý bạn test nhanh

- Bảng đầy đủ script theo từng task (#001–#017) và fixture chung: [`scripts/README.md`](../scripts/README.md) (tiếng Anh).

- Auth API (task 004): `scripts/004-auth/test-register.sh` (tạo user + workspace), `scripts/004-auth/test-login.sh` (đọc `scripts/_shared/login.json`), `scripts/004-auth/test-logout.sh`. File mẫu đăng ký: `scripts/_shared/register.example.json` (sửa email unique nếu dùng `REGISTER_JSON=`).

- Test import lead CSV (task 008): `scripts/008-csv-import/test-csv-import.sh`
- Test sequences end-to-end (task 009): `scripts/009-sequences-api/test-sequences-api.sh`
  - Nếu enroll fail vì leadId không tồn tại: chạy với `AUTO_CREATE_LEAD=1` để script tự tạo 1 lead test rồi enroll.
- Test outbound queue end-to-end (task 011): `scripts/011-outbound-mailer/test-queue.sh`
  - Script sẽ tự đọc `workspaceId` từ `scripts/_shared/workspace.json` (trừ khi bạn truyền `WORKSPACE_ID` để override).
- Test open tracking (task 012): `scripts/012-open-tracking/test-open-tracking.sh` (smoke); sau khi đã có ít nhất một email `SENT`, có thể `scripts/012-open-tracking/test-open-tracking.sh --integration` (kiểm tra DB + pixel 2 lần).

---

## API mới quan trọng (để nhớ nhanh)

- `POST /v1/sequences/:sequenceId/dispatch`
  - Trả `202 Accepted`
  - Mục tiêu: enqueue non-blocking
- `GET /v1/sequences/:sequenceId/dead-letters`
  - Trả danh sách job thất bại sau retry budget
- `GET /track/opens/:token` (không có prefix `/v1`)
  - Trả ảnh GIF 1×1 trong suốt; lần đầu hợp lệ ghi nhận mở email (xem mục “Theo dõi mở email” ở trên)

