# Project memory

## Product intent & audience

- ChatSales AI: SaaS app helping Nigerian small businesses manage customer enquiries and generate sales replies.
- No authentication; single-tenant shared schema (no sign-in flow).
- Core value: paste a customer enquiry → get ready-to-send reply suggestions using local rules/templates. User manually copies and pastes into WhatsApp.
- Strictly no paid APIs, API keys, fake payments, or automated WhatsApp sending. No secrets in frontend.

## Brand personality & voice

- Professional, modern, practical, trustworthy.
- Tailored to Nigerian small-business context (phone numbers, local commerce language).

## Visual design & UX direction

- Clean white base with WhatsApp-inspired green (#128C7E) as primary accent.
- Lucide React icons (including logos); no other icon/UI-theme packages.
- Tailwind CSS utility classes; React hooks; JSX.
- Fully responsive across Android phones, tablets, desktops; hamburger nav on mobile, full nav on larger screens.
- Hover states and smooth transitions throughout.
- Demo data records visually labeled with a "Demo data" badge.
- Path alias `@/` → `src/`; avoid deep relative imports.

## Decisions, constraints & rationale

- Backend: Supabase; tables for products, FAQs, leads with demo seed data.
- Settings stored in browser (localStorage), not Supabase.
- Reply engine: client-side rule-based, matches enquiry against catalogue (price quotes, availability, delivery, payment options, bulk discounts) and FAQ library; generates up to 4 suggestions; supports copy-to-clipboard and edit-before-copy.
- Routing via react-router-dom; explicit landing route and dashboard route (fixed early bug where nav links pointed to wrong routes).
- Lead statuses: New / Replied / Won / Closed, with filter support.
- Forms validate required fields, numeric price, valid phone number; delete actions require confirmation dialogs.
- Full CRUD implemented for products, FAQs, leads.
- Production build + type checks pass.

## Open questions & assumptions

- No auth/multi-tenancy assumed; if needed later, schema and RLS will require rework.
- Reply engine quality depends on maintained product/FAQ data; no ML improvement loop yet.
- Settings persistence is per-browser only; not synced across devices.