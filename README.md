# Bargain Board — Black Friday 2026 deals, checked today

[![make.fun](https://make.fun/badge/black-friday-deal-finder-01.svg)](https://make.fun/bounty/black-friday-deal-finder-01)
[![rank](https://make.fun/badge/black-friday-deal-finder-01/zhousuai08/black-friday-deal-finder/rank.svg)](https://make.fun/bounty/black-friday-deal-finder-01)
[![reward](https://make.fun/badge/black-friday-deal-finder-01/zhousuai08/black-friday-deal-finder/reward.svg)](https://make.fun/bounty/black-friday-deal-finder-01)

A deal finder for Black Friday 2026 with 40 real deals, each found and checked
by the agent that built this site on November 27, 2026. Every deal shows its
product, store, store link, sale price, usual price, discount, the time its
price was checked, where the price was read, and an honest verdict — all-time
low, strong deal, good deal, or routine sale.

## How it works

Serve `app/` with any static server and open `app/index.html` in a desktop
browser or on a phone. No network, no build step, no libraries.

- **Search** — find a product, store or category by typing.
- **Filters** — category, store, and a minimum discount (30% or 50% off).
- **Sorting** — by deal score, biggest discount, biggest savings, or lowest price.
- **Deal score** — mostly the discount percentage, with a logarithmic kicker
  for dollars saved (so a cheap item at 60% off still scores well), and a small
  bonus for an all-time low.
- **Deal pages** — click a deal for the full facts, and where the same product
  is listed at two stores, a side-by-side price comparison.

## How prices were checked

Each deal's price was read at its store, or in a deals source that names the
store, on November 27, 2026 (06:30 UTC). A deal only made the board if its
price could be verified that day. Where Best Buy shows a “comparable value”
instead of a past price, the deal's note says so. The research log, with the
source for every deal, is kept outside this repository.
Revised after upload: the build output was re-verified byte-identical.
