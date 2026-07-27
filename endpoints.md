# Vehiculars Backend — Verified API Endpoints Reference

This document describes the **actual, verified** REST API of the `vehicular_backend` FastAPI
service (Python/SQLAlchemy/Alembic, single-purpose Driver's Licence application platform — not
a multi-service/generic-`service_requests` system). It replaces a previous version of this file
that was written aspirationally and diverged from the real implementation in several places
(wrong payload field names for `enroll-driving-school` and `schedule-capture`, a fabricated
payout-on-completion narrative, a fabricated `/admin/metrics/transfers` endpoint, wrong status
names). Every endpoint below was checked directly against the router source
(`app/routers/*.py`) and Pydantic schemas (`app/schemas/*.py`).

**Base URL** (local dev): `http://localhost:8000` (`NEXT_PUBLIC_API_URL`).

---

## Global rules

- **Auth**: `Authorization: Bearer <access_token>` header. Unauthenticated → `401`. Wrong role → `403`.
- **Request tracing**: every response includes `X-Request-ID`.
- **Rate limiting**: `/auth/login` (5/min) and `/payments/*` (10/min) are rate-limited per caller; over-limit returns `429`.
- **Money**: all `*_kobo` fields are integers, ₦1.00 = 100 kobo. Never send floats.
- **Status values have no DB-level enum** — they're plain strings validated in Python
  (`app/core/status_machine.py`). Two separate transition graphs exist depending on
  `application_type`: `fresh` follows `FRESH_TRANSITIONS`, `renewal`/`reissue` follow
  `RENEWAL_REISSUE_TRANSITIONS` (they skip staff review entirely — any staff-router call against
  a renewal/reissue application returns `403`).

---

## 1. Health

| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/health` | None | `{"status": "ok"}` |

## 2. Reference data (`app/routers/reference.py`)

| Method | Path | Auth | Response |
|---|---|---|---|
| `GET` | `/reference/states` | None | `[{"id": 25, "code": "LA", "name": "Lagos", "capital": "Ikeja"}, ...]` |
| `GET` | `/reference/states/{state_id}/lgas` | None | `[{"id": 516, "state_id": 25, "name": "Ikeja"}, ...]`. `404` if state doesn't exist. |

## 3. Auth (`app/routers/auth.py`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/auth/register` | None | `{"name","email","phone","password","role":"customer"}` — `role` must be `"customer"`, else `403` | `UserResponse`, `201` |
| `POST` | `/auth/login` | None (rate-limited) | `{"email","password"}` | `{"access_token","token_type":"bearer","must_change_password","message"}` |
| `POST` | `/auth/set-password` | Bearer (any role) | `{"new_password"}` | `UserResponse` |
| `GET` | `/auth/me` | Bearer (any role) | — | `UserResponse` |
| `PATCH` | `/auth/me` | Bearer (any role) | `{"state_id","lga_id"}` — validated as a pair | `UserResponse` |

`UserResponse`: `{id, name, email, phone, role, is_active, must_change_password, state_id, lga_id, created_by, created_at, updated_at}`.

## 4. Customers (`app/routers/customers.py`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `GET` | `/customers/me` | `customer` | — | `UserResponse` |
| `PATCH` | `/customers/me` | `customer` | `{"state_id","lga_id"}` | `UserResponse` |
| `PUT` | `/customers/me/biodata` | `customer` | `BiodataUpdate` (partial, `exclude_unset`) | `BiodataResponse` |

## 5. Admin (`app/routers/admin.py`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/admin/users` | `admin` | `UserCreate` (`role` in customer/staff/agent/admin) | `UserResponse`, `201` |
| `POST` | `/admin/staff` | `admin` | `{"name","email","phone","temp_password"}` — always `must_change_password=true` | `UserResponse`, `201` |
| `POST` | `/admin/agents` | `admin` | `{"name","email","phone","temp_password","vio_office","state","lga","state_id"?,"lga_id"?,"capabilities":[...]}` | `AgentCreatedResponse`, `201` |
| `GET` | `/admin/staff` | `admin` | — | `list[UserResponse]` |
| `GET` | `/admin/agents` | `admin` | — | `list[AgentDetailResponse]` (includes `agent_profile`, `bank_account`, `wallet`) |
| `GET` | `/admin/agents/{id}` | `admin` | — | `AgentDetailResponse` |
| `PATCH` | `/admin/staff/{id}/deactivate` | `admin` | — | `UserResponse` |
| `PATCH` | `/admin/agents/{id}/deactivate` | `admin` | — | `UserResponse` |
| `GET` | `/admin/transfers/failed` | `admin` | — | `list[AgentTransferResponse]` (cached 60s, `X-Cache` header) |
| `GET` | `/admin/metrics/overview` | `admin` | — | `{gross_payments_kobo, platform_profit_kobo, agent_payables_paid_kobo, total_customers, total_staff, total_agents, applications_by_status: {status: count}}` |
| `GET` | `/admin/metrics/payments?from_date&to_date&group_by` | `admin` | — | `[{date, gross_kobo, count}, ...]` |
| `GET` | `/admin/metrics/agents` | `admin` | — | `[{agent_name, jobs_accepted, jobs_completed, lifetime_earnings_kobo}, ...]` |
| `GET` | `/admin/metrics/applications` | `admin` | — | `{total_applications, by_status: {...}, by_type: {...}}` |
| `GET` | `/admin/metrics/wallets` | `admin` | — | `{total_wallets, total_balance_kobo, total_funded_kobo, total_spent_kobo}` |
| `GET` | `/admin/metrics/lga-coverage?state_name` | `admin` | — | `[{state_name, lga_name, active_agents, pending_applications}, ...]` |

> There is **no** `/admin/metrics/transfers` endpoint — a previous version of this doc invented
> it. Use `GET /admin/transfers/failed` for failed-transfer monitoring.

## 6. Customer applications (`app/routers/applications.py`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/applications/driver-licence` | `customer` | `DLApplicationCreate` (below) | `DLApplicationResponse`, `201` — auto-creates a `pending` `Payment` + live `payment_options.checkout_url` |
| `POST` | `/applications/{id}/documents` | `customer` (owner) | `{"doc_type","file_url"}` (JSON) | `DLDocumentResponse`, `201` |
| `POST` | `/applications/{id}/documents/upload-file` | `customer` (owner) | multipart form: `doc_type` + file field | `DLDocumentResponse`, `201` |
| `PATCH` | `/applications/{id}/reapply` | `customer` (owner) | `DLApplicationReapply` (all fields optional; `documents: [{doc_type,file_url}]` not `id_document`) — only when `status == "staff_rejected"` | `DLApplicationResponse` — resets to `submitted` |
| `GET` | `/applications` (aliases `/`, `/my`, `/details`, `/history`, `/my/history`) | `customer` | — | `list[DLApplicationResponse]` — current customer's own applications |
| `GET` | `/applications/{id}` (alias `/{id}/details`) | Owner or `staff`/`admin` | — | `DLApplicationResponse` — includes `documents`, `events`, live `payment_options` |
| `GET` | `/applications/{id}/history` | Owner or `staff`/`admin` | — | `list[DLEventResponse]` |
| `POST` | `/applications/{id}/pay-from-wallet` | `customer` (owner) | `{"amount_kobo"?}` | `WalletPayResponse` |
| `POST` | `/applications/{id}/confirm-receipt` | `customer` (owner) | — | `DLApplicationResponse` — **only legal when `status == "awaiting_customer"`**, moves to `completed`. This is the customer-side completion action; currently unused by the frontend. |

`DLApplicationCreate`: `{application_type: "fresh"|"renewal"|"reissue", first_name, middle_name?, last_name, date_of_birth, gender?, state_of_origin?, lga_of_origin?, nationality?, visa_status?, marital_status?, residential_address?, nin?, driving_school_certificate_number?, validity_period?, licence_class?, blood_group?, genotype?, state_of_residence?, lga?, state_id?, lga_id?, next_of_kin_name, next_of_kin_relationship?, next_of_kin_phone, id_document?: {doc_type,file_url}, documents?: [{doc_type,file_url}]}`.

`DLApplicationResponse` includes (among the create fields): `id, user_id, status, staff_id, staff_note, assigned_agent_id, driving_school_enrolled_at, driving_school_target_date, driving_school_certificate_received_at, capture_scheduled_at, capture_centre_name, captured_at, dispatched_by, dispatched_at, tracking_note, created_at, updated_at, documents: [DLDocumentResponse], events: [DLEventResponse], payment_options, payment_status, missing_documents`.

## 7. Staff (`app/routers/staff.py`)

> **Policy**: `fresh` applications require staff review; `renewal`/`reissue` bypass it entirely —
> any staff-router call against one returns `403`.

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `GET` | `/staff/queue?status&application_type&state&lga&staff_id&page&page_size` | `staff`,`admin` | — | `{items: [StaffQueueItem], total, page, page_size, total_pages}` — paginated, defaults to `application_type=fresh` (renewal/reissue never shown unless explicitly requested), lightweight (no per-row Monnify verification call). **Preferred over `/staff/applications` for new work.** |
| `GET` | `/staff/applications?status` | `staff`,`admin` | — | `list[StaffApplicationResponse]` — legacy, unpaginated, **fresh-only**, still supported |
| `GET` | `/staff/applications/{id}` | `staff`,`admin` | — | `StaffApplicationResponse` |
| `POST` | `/staff/applications/{id}/approve` | `staff`,`admin` | `{"note"?}` | `StaffApplicationResponse` |
| `POST` | `/staff/applications/{id}/reject` | `staff`,`admin` | `{"reason"}` | `StaffApplicationResponse` → `staff_rejected` |
| `POST` | `/staff/applications/{id}/enroll-driving-school` | `staff`,`admin` | `{"screenshot_url"}` (also accepts `verification_image_url`/`file_url`; multipart file upload also supported) — **no `target_date`/`driving_school_name` control, the server computes `driving_school_target_date` itself** via holiday-aware 26-business-day countdown | `StaffApplicationResponse` → `driving_school_enrolled`, includes computed `driving_school_target_date`/`driving_school_countdown` |
| `POST` | `/staff/applications/{id}/upload-driving-school-certificate?force=true` | `staff`,`admin` | `{"certificate_url"}` (also `file_url`) | `StaffApplicationResponse` → `driving_school_certificate_ready` then auto `routed`. `400` if countdown hasn't finished unless `?force=true` (dev only) |
| `POST` | `/staff/applications/{id}/route` | `staff`,`admin` | — | `list[dict]` of created offers. `400` unless status is `driving_school_certificate_ready` or `routed` |
| `POST` | `/staff/applications/{id}/final-review` | `staff`,`admin` | `{"note"?}` | `StaffApplicationResponse` — only from `agent_completed`, chains straight to `awaiting_customer` |
| `POST` | `/staff/documents/{doc_id}/review` | `staff`,`admin` | `{"decision","note"?}` | `{"message","document_id","status","review_note"}` — sets the document's own `status`/`review_note`, independent of application status |
| `POST` | `/staff/applications/{id}/push-to-customer` | `staff`,`admin` | `{"dispatched_by"?,"tracking_note"?}` | `StaffApplicationResponse` — sets `dispatched_by`/`dispatched_at`/`tracking_note`, ensures status is `awaiting_customer` |

`StaffQueueItem`: `{id, application_type, applicant_name, status, payment_status, state_of_residence, lga, staff_id, created_at, updated_at}`.

## 8. Agent (`app/routers/agent.py`)

> Payout timing: the agent's 85%-service-fee `AgentTransfer` is created and paid out via a
> Monnify disbursement **when the agent accepts the offer** (if payment has already succeeded at
> that point) — not on completion/`upload-proof`. If payment succeeds *after* the agent has
> already accepted, the same payout fires from wherever payment confirmation lands (webhook or
> polling), idempotently. A previous version of this doc wrongly described the payout as firing
> on `upload-proof`.

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `GET` | `/agent/offers` | `agent` | — | `[{id: "offer_N", application_id: "app_N", status, application_type, lga}, ...]` — auto-syncs any newly-routed same-LGA applications into fresh offers first |
| `POST` | `/agent/offers/{id}/accept` | `agent` | — | `{offer_id, status, application_id, application_status}` — `400` if agent has no verified bank account yet |
| `POST` | `/agent/offers/{id}/decline` | `agent` | `{"reason"?}` | `{message, offer_id}` — re-routes to other agents |
| `GET` | `/agent/applications` | `agent` | — | list of the agent's assigned applications with `documents`, `events`, `payment_status` embedded |
| `POST` | `/agent/applications/{id}/schedule-capturing` (alias `/schedule-capture`) | `agent` | `{"capturing_date"?, "scheduled_at"?, "centre_name"?, "note"?}` | `{message, application_id, status, capturing_date, scheduled_at}` → `capture_scheduled` |
| `POST` | `/agent/applications/{id}/reassign-capture-centre` | `agent` | `{"new_centre_name", "new_scheduled_at"?, "reason"?}` | `{message, application_id, status, old_centre_name, new_centre_name}` — only from `capture_scheduled`/`capturing_scheduled` |
| `POST` | `/agent/applications/{id}/capturing-completed` (alias `/mark-captured`) | `agent` | — (no body) | `{message, application_id, status}` → `captured` |
| `POST` | `/agent/applications/{id}/ready-for-pickup` | `agent` | — | `{message, application_id, status}` → `ready_for_pickup` |
| `POST` | `/agent/applications/{id}/flag-document-issue` | `agent` | `{"reason"}` | `{message, application_id, status, reason}` → `needs_correction`. **Renewal/reissue only**, from `agent_assigned` |
| `POST` | `/agent/applications/{id}/upload-proof` | `agent` | `{"proof_url"}` (also `file_url`; multipart also supported) | `{message, document_id, doc_type, file_url, status}` → `agent_completed` (fresh) or `agent_completed`→`awaiting_customer` (renewal/reissue auto-chain). **No payout fields in this response** — payout already happened at accept time |
| `POST` | `/agent/bank-account` | `agent` | `{"bank_code","account_number"}` — **no `account_name`, the server resolves it via Monnify's account-validation API** | `AgentBankAccountResponse` — no `paystack_recipient_code`-equivalent field; Monnify disbursements take bank code + account number directly, no recipient object to create/store |
| `GET` | `/agent/bank-account` | `agent` | — | `AgentBankAccountResponse` or `{}` if none set |
| `GET` | `/agent/transfers` | `agent` | — | `list[AgentTransferResponse]` |
| `GET` | `/agent/notifications-log` | `agent` | — | `{sms_messages: [...], whatsapp_messages: [...]}` — dev/debug log of everything sent |

## 9. Wallet (`app/routers/wallet.py`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `GET` | `/wallet` | `customer` | — | `{balance_kobo, virtual_account: {bank_name, bank_code, account_number, account_name} \| null, needs_identity_verification}` — auto-creates the wallet ledger; the virtual account is a **real Monnify reserved account**, silently activated using an existing DL application's NIN if one's on file, otherwise `virtual_account` is `null` and `needs_identity_verification` is `true` until `POST /wallet/activate` is called |
| `POST` | `/wallet/activate` | `customer` | `{"bvn"?, "nin"?}` — at least one required | `WalletResponse` (same shape as `GET /wallet`) — creates the real Monnify reserved account; neither `bvn` nor `nin` is persisted, only forwarded to Monnify. `502` if Monnify is configured but the call fails. Replaces the old `POST /wallet/virtual-account`, which fabricated a fake account number — that endpoint no longer exists. |
| `POST` | `/wallet/deposit/initialize` | `customer` | `{"amount_kobo"}` | `{authorization_url, reference, amount_kobo}` — Monnify checkout link |
| `POST` | `/wallet/deposit/verify` | `customer` | `{"reference"}` | `WalletResponse` — idempotent, credits balance once |
| `POST` | `/wallet/pay` | `customer` | `{"application_id","amount_kobo"?}` | `WalletPayResponse` — delegates to the same logic as `/applications/{id}/pay-from-wallet` |
| `GET` | `/wallet/transactions` | `customer` | — | `list[WalletTransactionResponse]` |

## 10. Payments (`app/routers/payments.py`)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| `POST` | `/payments/{id}/initialize` | `customer` (owner) | `{"amount_kobo"?}` | `{authorization_url, reference, amount_kobo}` — creates the `Payment` row if missing, or refreshes a stale checkout link. **Not called anywhere in the frontend today** — `payment_options` is already auto-embedded in the application create/GET response, so this is only needed for a "retry/refresh payment link" affordance. |
| `POST`/`GET` `/payments/verify` / `/payments/verify/{reference}` | None | `{"reference"?, "application_id"?}` (POST) | `PaymentVerifyResponse` — polls Monnify, marks `success` idempotently, triggers auto-route for renewal/reissue |
| `POST` | `/payments/{id}/pay-from-wallet` | `customer` (owner) | `{"amount_kobo"?}` | `WalletPayResponse` |

## 11. Webhooks (`app/routers/webhooks.py`)

| Method | Path | Auth | Body |
|---|---|---|---|
| `POST` | `/webhooks/monnify` | `monnify-signature` header — `SHA-512(MONNIFY_SECRET_KEY + raw_body)`, **plain concatenation, not HMAC** (Paystack's old scheme was HMAC-SHA512; do not confuse the two) | Monnify event JSON (`{eventType, eventData}`). Handles `SUCCESSFUL_TRANSACTION` (application payments + reserved-account wallet deposits, split by `eventData.product.type`) and `SUCCESSFUL_DISBURSEMENT`/`FAILED_DISBURSEMENT` (agent payouts) idempotently. Replaces the old `/webhooks/paystack`, which no longer exists. |

---

## State machine (verified against `app/core/status_machine.py`)

**Fresh**: `submitted → staff_review → driving_school_enrolled → driving_school_certificate_ready → (agent_assigned | routed) → agent_accepted → capture_scheduled/capturing_scheduled → captured/capturing_completed → agent_completed → staff_final_review → awaiting_customer → completed`. `staff_rejected` only ever goes back to `submitted`.

**Renewal/Reissue**: `submitted → routed → agent_assigned/agent_accepted → capturing_completed/ready_for_pickup/in_process → agent_completed → awaiting_customer → completed`. Can also detour through `needs_correction → agent_assigned` via `flag-document-issue`.

| Status | Who acts | Endpoint |
|---|---|---|
| `submitted` (fresh) | staff | `POST /staff/applications/{id}/approve` → `staff_review`, or `/reject` → `staff_rejected` |
| `submitted` (renewal/reissue) | system | auto-routes on payment success, no staff action possible (`403`) |
| `staff_review` | staff | `POST /staff/applications/{id}/enroll-driving-school` → `driving_school_enrolled` |
| `driving_school_enrolled` | staff | `POST /staff/applications/{id}/upload-driving-school-certificate` → `driving_school_certificate_ready` → auto `routed` |
| `routed` | agent | `POST /agent/offers/{id}/accept` → `agent_accepted` |
| `agent_accepted` | agent | `POST /agent/applications/{id}/schedule-capturing` → `capture_scheduled` |
| `capture_scheduled`/`capturing_scheduled` | agent | `POST .../reassign-capture-centre` (stays same status) or `POST .../capturing-completed` → `captured` |
| `captured` | agent | `POST /agent/applications/{id}/upload-proof` → `agent_completed` |
| `agent_completed` (fresh) | staff | `POST /staff/applications/{id}/final-review` → `staff_final_review` → auto `awaiting_customer` |
| `agent_completed` (renewal/reissue) | system | auto-chains straight to `awaiting_customer` inside `upload-proof` |
| `awaiting_customer` | customer | `POST /applications/{id}/confirm-receipt` → `completed` |
