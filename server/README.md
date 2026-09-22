# ShareFinance API

Node.js + Express + TypeScript + Prisma/MySQL backend for ShareFinance.

## Setup

1. Copy the env template and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   At minimum you need to set:
   - `DATABASE_URL` — your MySQL connection string
   - `JWT_ACCESS_SECRET` — any long random string
   - `TEEKRR_API_BASE_URL` / `TEEKRR_API_KEY` — once you have them (leave `NOTIFICATION_PROVIDER=mock` until then; OTP codes will be logged to the console instead of sent over WhatsApp)

2. Install dependencies (already done if you just cloned/pulled):
   ```bash
   npm install
   ```

3. Create the database schema:
   ```bash
   npm run prisma:migrate -- --name init
   ```

4. Seed demo data (recreates the two mock groups — Ibu-Ibu Blok C and Warung Circle — with their full member/round/payment history):
   ```bash
   npm run prisma:seed
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```
   Runs on `http://localhost:4000` by default. `GET /health` checks DB connectivity.

## Trying it out

With `NOTIFICATION_PROVIDER=mock` (the default), OTP codes are logged to the server console instead of sent over WhatsApp — look for `[MockWhatsAppService] otp -> <phone>` in the terminal, or set `DEBUG_OTP_ECHO=true` in `.env` to have the code returned directly in the `/auth/otp/request` response (dev only, never enable in production).

Seeded users' phones (E.164), e.g. Sari W. (organizer of Ibu-Ibu Blok C): `+60123456789`.

```bash
# 1. Request an OTP
curl -X POST localhost:4000/auth/otp/request -H 'Content-Type: application/json' \
  -d '{"phone":"+60123456789"}'

# 2. Verify it (use the code from the server console, or the debugCode field if DEBUG_OTP_ECHO=true)
curl -X POST localhost:4000/auth/otp/verify -H 'Content-Type: application/json' \
  -d '{"phone":"+60123456789","code":"123456"}'

# 3. Use the returned accessToken
curl localhost:4000/me/dashboard -H 'Authorization: Bearer <accessToken>'
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Type-check + compile to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | Type-check only, no output |
| `npm run prisma:migrate` | Create/apply a migration in dev |
| `npm run prisma:deploy` | Apply migrations in prod (no schema drift prompts) |
| `npm run prisma:seed` | Re-run the seed script (idempotent — skips groups that already exist) |
| `npm run prisma:studio` | Open Prisma Studio to browse the DB |

## Switching on real providers later

- **WhatsApp (Teekrr)**: set `NOTIFICATION_PROVIDER=teekrr` plus `TEEKRR_API_BASE_URL`/`TEEKRR_API_KEY`. The client (`src/services/notification/TeekrrWhatsAppService.ts`) is wired to Teekrr's real `POST /whatsapp` "quick broadcast" endpoint. Create the following templates on the Teekrr platform — names must match `TEMPLATES` in that file exactly, or update the file to match whatever you actually name them. `amount` is always sent as a pre-formatted string like `"RM 500.00"`, not a raw number; `recipients` are sent without the leading `+` (e.g. `60123456789`).

  Message content below is in Bahasa Malaysia, ready to paste into Teekrr's template editor — swap the `{{param}}` placeholder syntax for whatever Teekrr's editor actually expects (named `{{param}}` vs positional `{{1}}`, `{{2}}`...) if it differs.

  ### `c1_otp_share_finance`
  Params: `verificationCode`
  > Kod pengesahan ShareFinance anda ialah *{{verificationCode}}*. Kod ini sah selama 5 minit. Jangan kongsi kod ini dengan sesiapa.

  ### `c1_payment_reminder_share_finance`
  Params: `groupName`, `roundNumber`, `amount`, `dueDate`
  > Peringatan mesra: Sumbangan anda untuk kumpulan *{{groupName}}* (pusingan {{roundNumber}}) sebanyak *{{amount}}* perlu dibayar sebelum {{dueDate}}. Sila buat pembayaran melalui app ShareFinance.

  ### `c1_payment_receipt_share_finance`
  Params: `groupName`, `roundNumber`, `amount`, `reference`
  > Pembayaran diterima! Sumbangan *{{amount}}* untuk kumpulan *{{groupName}}* (pusingan {{roundNumber}}) telah berjaya diproses. No. rujukan: {{reference}}. Terima kasih atas pembayaran anda.

  ### `c1_payout_order_change_share_finance`
  Params: `groupName`, `roundNumber`, `reason`
  > Susunan giliran pengeluaran untuk kumpulan *{{groupName}}* (pusingan {{roundNumber}}) telah dikemas kini. Sebab: {{reason}}. Sila semak app ShareFinance untuk butiran penuh.

  ### `c1_payout_receipt_share_finance`
  Params: `groupName`, `roundNumber`, `amount`, `reference`
  > Bayaran pengeluaran telah dihantar! *{{amount}}* untuk kumpulan *{{groupName}}* (pusingan {{roundNumber}}) telah dikreditkan ke akaun anda. No. rujukan: {{reference}}.

  ### `c1_payout_hold_share_finance`
  Params: `groupName`, `roundNumber`, `reason`
  > Pengeluaran untuk kumpulan *{{groupName}}* (pusingan {{roundNumber}}) telah digantung buat sementara waktu. Sebab: {{reason}}. Dana anda kekal selamat dalam akaun amanah — sila semak app untuk maklumat lanjut.

  ### `c1_extension_request_share_finance`
  Params: `groupName`, `roundNumber`, `memberName`, `reason`
  > *{{memberName}}* memohon lanjutan masa untuk pembayaran pusingan {{roundNumber}} dalam kumpulan *{{groupName}}*. Sebab: {{reason}}. Sila semak app ShareFinance untuk meluluskan atau menolak permohonan ini.

  ### `c1_group_invite_share_finance`
  Params: `groupName`, `inviteCode`
  > Anda dijemput menyertai kumpulan kutu *{{groupName}}* di ShareFinance! Gunakan kod jemputan *{{inviteCode}}* untuk menyertai. Muat turun app ShareFinance untuk bermula.

- **Payment gateway**: set `PAYMENT_GATEWAY_PROVIDER` and implement a new class alongside `src/services/payment-gateway/SimulatedPaymentGatewayService.ts`, wired into `src/services/payment-gateway/index.ts`'s factory switch.
