# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: the organizer.** This is the person who runs a *kutu*, the rotating savings group common across Malaysia. Examples are a neighbour running Ibu-Ibu Blok C or someone running a Warung Circle among colleagues or stallholders. Today they keep the kutu in a notebook and a WhatsApp group. Their job: set the contribution amount and frequency, fill the slots, agree the payout order, collect every round, chase late payers, and release each payout to the right person on the right day. When anything goes wrong, they carry the social responsibility.

**Secondary: members.** Members usually join from a WhatsApp link or a `KUTU-XXXX` invite code. They check what they owe and when, pay, and see when their turn comes.

## Product Purpose

Share Finance runs a kutu without the notebook. Contributions are collected by card, the payout order is set and visible to every member, and every ringgit is recorded in one shared ledger. Success means an organizer can run a full cycle, from the first contribution to the last payout, without keeping a private record, handling cash, or settling disputes about who paid and whose turn it is.

## Positioning

**Trust through transparency.** A notebook asks every member to trust the organizer. Share Finance replaces that trust with shared visibility. Every member sees the same ledger. The payout order is agreed in the open, with a stated reason when someone moves up. A random draw runs once, and everyone sees the same result and its timestamp. Money safety (Stripe, MyKad checks, payout holds) and reduced admin (automatic collection, WhatsApp reminders) back up this claim, but they are not the claim.

## Operating Context

- WhatsApp is how the group coordinates. Invites, OTP codes, payment reminders, receipts, payout notices and payout-order changes are all sent as WhatsApp messages in Bahasa Malaysia, through Teekrr templates.
- Sign-in uses a Malaysian mobile number (+60) and a 6-digit OTP. There is no password.
- A group has a fixed number of slots, a fixed contribution in RM, a weekly or monthly frequency, and one payout per round.
- Members pay each round through Stripe card checkout. Recipients receive payouts through Stripe Connect onboarding.
- A member must pass a MyKad identity check before they can receive a payout.

## Capabilities and Constraints

- **Groups:** create a group (name, amount, frequency, slots, first payout date, late fee and grace period, payout-order method); invite members by code or link; organizer and member roles.
- **Payout order:** three methods. *assigned* (the organizer drags members into the agreed order and adds a reason for any earlier turn), *random* (one shuffle once all slots are filled), and *join-order* (first to accept goes first). Members can make priority requests, and every order change is logged.
- **Rounds and payments:** payment statuses are paid, paid late, unpaid and failed. Rounds can be upcoming, current, held, payout pending or paid out. Payout day releases funds automatically, and the organizer can place a payout on hold. Members can request payment extensions.
- **Terminology:** *kutu*, *organizer*, *member*, *round*, *contribution*, *payout*, *payout order*, *invite code* (`KUTU-XXXX`), *MyKad*. Amounts are shown as `RM 1,234.00` (en-MY locale).
- **Stack (existing):** React 19 + Vite + TypeScript + CSS Modules + lucide-react on the frontend; Express + Prisma/MySQL on the backend.
- **Language:** the UI is in English only for now. Only the WhatsApp templates are in Bahasa Malaysia.
- **Stage:** prototype / demo. There are no real users yet.
- **Undecided:** which device organizers mainly use (phone or desktop). The current UI has a desktop sidebar shell and no responsive breakpoints. Whether the UI gets a BM localisation is also undecided.

## Brand Commitments

- The name is **Share Finance** ("ShareFinance" in backend and WhatsApp copy).
- The existing voice is plain, short and reassuring, with local context: "Run your kutu without the notebook." "We'll text you a 6-digit code. No password to forget." "Saved as a draft. Nobody is charged until you start."

## Evidence on Hand

- There are two seeded demo groups, **Ibu-Ibu Blok C** (organizer Sari W.) and **Warung Circle**. They include full member, round and payment history (`server/prisma/seed`), and they are the main demo content.
- There are no real users, testimonials, partner logos, usage numbers, regulatory approvals or press. Future work must not invent any of these, and must not claim licensing or trust-account status beyond what the product actually implements.

## Product Principles

1. **Everyone sees the same truth.** Any fact that affects a member's money (who paid, whose turn it is, why the order changed) is visible to the whole group, not only the organizer.
2. **Carry the organizer's burden.** Chasing, reminding, reconciling and releasing are the product's job. The organizer should only step in to make decisions.
3. **Agreement before money moves.** Nothing is charged until the group starts, and order changes carry a reason and leave a record.
4. **Speak like the group already does.** Use local terms, ringgit and WhatsApp, not banking jargon.
5. **Don't overclaim.** This is a prototype, so show only safety and trust signals the system actually enforces.
