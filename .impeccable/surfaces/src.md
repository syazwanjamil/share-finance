---
version: 1
slug: "src"
primary_target: "src"
related_targets: []
---

# Share Finance app (all routes)

Mode: Operate. Scope: whole app redesign (auth, welcome, create wizard, home, group detail, ledger, payout order, payout release/receipt, checkout, payout setup). Phone and desktop equally.

Audience: organizers running a kutu (phone inside WhatsApp, sometimes laptop); members checking what they owe and when their turn is. Job: see who paid, chase unpaid, release payouts, all from one shared truth.

Decisions: minimal read-only ledger ships (contributions, payouts, order changes, draw, all members see it); Payments/Notifications nav removed. Invented claims from the 2026-09-29 critique are deleted or driven by real data. Light default with a dark "night print" theme. Fonts chosen at build: engraved-feel face with tabular figures for amounts/serials, workhorse sans for reading.

## Direction contract

THESIS: Each group is its own note series, printed with the security features people check by habit: security print is visibility, which is the product's claim. Refuses the neobank KPI-tile dashboard and the cream-and-terracotta notebook.

OWN-WORLD: Cool paper ground, ink-black text, one series colour per group (fixed set of six) filling its note face only. Guilloche linework, microprinted rules, a see-through window, serial-set figures for real references (invite code, round, ledger refs). Status by mark and ink, not hue alone. One primary action per screen in the reserved colour. Night print dark theme.

STORY: The visitor sees whose turn it is and how full this round's pot is, trusts it because every member sees the same note and ledger, and acts: pay, remind, or issue the payout.

FIRST VIEWPORT: Group page: the current round as a note face spanning the column, pot as the largest figure, recipient name in the window, guilloche rosette with one loop per member (inked paid, ghost unpaid), unpaid members listed directly below with the single primary action. Desktop: note plus ledger side by side, narrow rail nav.

FORM: Note Series, rank 1 on the re-rolled grounded list (IMPECCABLE'S PICK). Seed key 6721914e. Signature interaction: the note prints in once (one petal inks per paid member, the microprint rule prints across), and a payment that lands inks its own petal; a full rosette means the note can be issued (Release payout). Raises: preview before irreversible actions; literal region labels; fixed size ramp with the pot largest.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
