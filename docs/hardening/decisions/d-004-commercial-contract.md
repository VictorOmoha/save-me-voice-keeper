# D-004 — Commercial contract

**Status:** Approved by Victor Omoha on 2026-08-10.

## Launch catalog

Self-serve plans are monthly only:

| Stable ID | Display name | Price | Entry quota | Storage quota |
|---|---|---:|---:|---:|
| `free` | Free | $0 | 50 | 500 MB |
| `basic` | Basic | $9/month | Unlimited | 5 GB |
| `premium` | Premium | $19/month | Unlimited | 50 GB |

Pro, Teams, annual, and Enterprise products are not part of the launch catalog. Remove their public claims and do not retain dormant sellable mappings.

## Trial and entitlements

There is no paid trial at launch. The Free plan is the no-card evaluation path.

- Voice input and portable export are available on every plan.
- Basic adds browser-extension access and advanced search.
- Premium adds agent API access.
- “Backup,” custom integrations, enhanced privacy controls, priority/24-7/dedicated support, and mobile/desktop platform claims are removed until the capabilities are operationally real.

Export is a data-rights capability, not a premium differentiator.

## Billing lifecycle

- Upgrades take effect immediately with Stripe proration.
- Downgrades and cancellations take effect at the end of the paid period.
- A `past_due` subscription retains full paid access for a 7-day grace period.
- After downgrade or grace expiry, existing content remains readable and exportable. Writes to over-limit resources are soft-locked until usage is reduced or the plan is upgraded.
- No silent deletion occurs because of downgrade, cancellation, or failed payment.
- Stripe card payments are the only launch payment method.
- No partial-month refunds except where legally required.

Stripe price mapping and server-side entitlement checks are authoritative. Unknown price IDs must fail closed and alert; they must never default to a paid tier.

## Required claim removals

Remove or replace claims for: 14-day trial; card-required trial; PayPal; annual billing; Pro/Teams/Enterprise; all-platform/mobile/desktop access; backup; custom integrations; enhanced privacy controls; priority/24-7/dedicated support; and unconditional prorated refunds.

Impacted tickets: SAVE-003, SAVE-103, SAVE-105, and SAVE-106.
