# AGENTS.md

## Mission

Airline-Fees.com is not being rebuilt as a neutral airline fee encyclopedia.

The product goal is to become a consumer-advocacy decision engine that helps travelers avoid fee traps, understand enforcement reality, and make better money-saving choices before booking and before flying.

This repo exists to publish:

- structured airline fee data
- expert interpretation of how fees are actually triggered
- tactical, verdict-first guidance
- deterministic tools that help users save money

The strategic reason for this direction matters:

- the prior site was rejected by AdSense for `Low Value Content`
- generic fee rows without analysis are not enough
- templated pages with low information gain are not enough
- we need original value, expert framing, and practical utility on every important page

Future work should reinforce that positioning, not dilute it.

## Core Product Thesis

The site should move from `reference database` to `decision engine`.

That means our best pages do not stop at:

- what the published fee is
- what the official dimensions are
- what the airline says in sterile policy language

They continue into:

- what usually triggers the charge
- where enforcement is real vs inconsistent
- which workaround is legitimate and practical
- when paying for a card, bundle, or fare upgrade is rational
- when the airline’s pricing structure is a trap

The winning user journey is:

`Search query -> Guide or fee-topic page -> Airline authority page -> Tool -> Monetization`

Do not design the site around a pure browse-by-airline database flow.

## Current Product Surface

Important live routes currently include:

- `/`
- `/airlines`
- `/airlines/[slug]`
- `/airlines/[slug]/how-to-beat-fees`
- `/best-cards`
- `/sizer-rules`
- `/fees/...`
- `/guides/...`
- `/methodology`

JSON airline data lives in:

- `data/airlines/[slug].json`

Current priority airlines:

- United
- Delta
- American
- Southwest
- JetBlue
- Alaska
- Spirit
- Frontier
- Ryanair
- EasyJet

Depth on those airlines is more valuable than shallow expansion across dozens of carriers.

## Tone And Editorial Standard

Write like an informed traveler advocate, not a passive catalog.

Preferred tone:

- expert
- specific
- practical
- slightly opinionated
- verdict-first
- plain English

Avoid:

- bland neutral summaries
- filler introductions
- obvious restatements of airline policy
- database-like wording
- “it depends” hedging unless it is genuinely necessary

Good page behavior:

- lead with the takeaway
- explain the trap
- explain the tactical response
- distinguish policy from enforcement reality
- clearly state uncertainty when data is incomplete

Bad page behavior:

- repeating fee rows without interpretation
- using the same section framing across every airline with only nouns swapped
- publishing “SEO pages” that add no original analysis

## Information Gain Rules

Every important page should create information gain.

Information gain on this site usually means one or more of:

- fee-stack math
- trap identification
- real-world enforcement interpretation
- consumer strategy
- comparison framing
- deterministic recommendation logic
- “when this is worth paying for” analysis

If a proposed page or edit only paraphrases official airline copy, it is probably not good enough.

When writing, prefer ideas like:

- “This fee is mostly avoidable if you do X before Y.”
- “This is where the airline’s published rule and actual gate behavior diverge.”
- “This looks cheap until the bag math makes it more expensive than the next fare.”
- “This tool only recommends a card when the first-bag savings actually beat the annual fee.”

## SEO And Content Principles

SEO strategy should follow business value, not just keyword expansion.

### Primary SEO beliefs

- guide pages and fee-topic pages are major traffic entry points
- airline pages are authority-support pages, not the only stars of the site
- structured data matters, but differentiated interpretation matters more
- pages should target search intent with a strong answer, not just a keyword mention

### Practical SEO rules

- prioritize pages with clear search intent and money-saving utility
- make page titles and H1s concrete, not vague brand language
- satisfy the query fast with a verdict or actionable summary near the top
- build dense internal links between guides, fee pages, airline pages, and tools
- avoid thin page factories or massive low-depth route expansion
- do not create near-duplicate pages that only swap airline names or fee labels

### Content structure guidance

On guides and fee-topic pages, prefer this order:

1. verdict or key takeaway
2. fee trap or traveler problem
3. what to do instead
4. airline-specific implications
5. tool or monetization bridge where useful

On airline pages, prefer this order:

1. quick airline verdict
2. highest-risk fee traps
3. fee table or structured facts
4. “how to beat fees” path
5. relevant guides and tools

### Do not optimize for the wrong thing

Do not turn the site into:

- a generic airline wiki
- an auto-generated fee glossary
- a neutral “policy center”
- a page-count SEO play

## Internal Linking Rules

Internal linking is strategic infrastructure, not an afterthought.

Every meaningful page should help move users deeper into the decision journey.

### Required linking behavior

- guides should link to relevant airline pages
- fee-topic pages should link to affected airlines and relevant tools
- airline pages should link to `how-to-beat-fees`, related fee topics, and tools
- tool pages should link back to the airline or fee context that makes the tool useful
- homepage and hub pages should reinforce priority routes, not scatter attention randomly

### Linking priorities

Prefer links that strengthen:

- authority
- next-step usefulness
- monetization path
- crawl depth to valuable pages

### Avoid

- orphan pages
- dead-end pages
- random link stuffing
- linking to routes that do not exist yet
- changing slugs casually

Broken internal links, route duplication, and accidental 404s are high-severity issues.

## Monetization Principles

Monetization should feel like a useful extension of the decision, not an interruption.

The current monetization bridge is primarily through deterministic tools and product recommendations such as:

- `/best-cards`
- `/sizer-rules`

### Monetization rules

- tools must remain genuinely useful even without conversion
- recommendations must be explainable and deterministic
- if a tool ranks or recommends something, the logic should be inspectable in code
- do not force affiliate outcomes where the math or traveler context does not support them
- frame products as tactical solutions to specific fee problems

### Good monetization examples

- show when a checked-bag card breaks even based on actual fee inputs
- recommend bag types that reduce sizer risk because of shape and enforcement reality
- connect a guide about Basic Economy traps to a card or fare strategy only when it solves the stated problem

### Bad monetization examples

- generic “best travel cards” content disconnected from fee math
- affiliate blocks with no decision logic
- soft advertorial copy that weakens trust

Trust is the monetization asset. Protect it.

## Engineering Principles

This repo uses:

- Next.js App Router
- TypeScript
- Tailwind CSS
- JSON-driven airline data

### Engineering priorities

- preserve route consistency
- keep tools deterministic
- protect crawlable content output
- prevent hydration issues
- prevent broken HTML and invalid nesting
- protect UX on mobile and desktop
- preserve existing styling patterns unless there is a strong product reason to change them

### Deterministic tool standard

For tools like `/best-cards` and similar utilities:

- use explicit inputs
- use explicit assumptions
- avoid hidden scoring
- avoid fuzzy AI-style recommendations
- expose the modeled constraints in copy where relevant

If a recommendation depends on assumptions, state them.

### Data handling standard

- prefer official published airline sources for fee facts
- if a fee or rule is not published clearly, do not invent certainty
- preserve schema consistency in `data/airlines/[slug].json`
- do not add speculative fields casually

### App Router and route discipline

- keep route naming consistent with the existing information architecture
- avoid duplicate content across similar routes
- do not create alternate route trees for the same intent without a very strong reason
- be careful when adding pages under `/fees` and `/guides` so they fit the roadmap and linking model

### UX bug severity

Treat these as high priority:

- broken navigation
- broken internal links
- 404s from in-site links
- hydration warnings
- invalid HTML
- unreadable tables on mobile
- components that make fee information harder to understand

## Content And Code Quality Bar

When editing copy or building pages, ask:

- does this say something useful that a careful traveler would not get from the airline page alone?
- does this help the user make a decision?
- does this sound like expert guidance rather than generated filler?
- does this create a sensible next click?
- does this support trust and eventual monetization?

When editing code, ask:

- does this preserve deterministic behavior?
- does this protect existing routes and links?
- does this keep structured data usable?
- does this improve clarity rather than adding noise?

## Prioritization Rules

When choosing work, prioritize in this order:

1. broken UX, rendering, routing, or data integrity issues
2. pages and features that increase information gain on high-intent entry pages
3. internal linking improvements that connect guides, airline pages, and tools
4. priority-airline depth improvements
5. monetization bridges that remain useful and deterministic
6. lower-priority airline expansion

In content terms, prefer:

- stronger guides
- stronger fee-topic pages
- stronger airline authority pages for priority carriers
- better transitions into tools

Over:

- adding lots of thin airline pages
- cosmetic rewrites with no strategic effect
- broad coverage expansion without depth

## What Not To Do

Do not:

- revert the product into a generic neutral fee reference
- ship bland filler content
- create templated pages with minimal original insight
- publish unsupported claims about enforcement or savings
- make tools nondeterministic just to sound smarter
- create random pages outside the current roadmap
- add route variants that compete with existing routes
- weaken internal linking
- break working styling patterns without a clear product reason
- optimize for page count over usefulness
- introduce soft, vague, affiliate-first copy

## How To Decide The Next Task

If no task is specified, use this decision filter.

### Step 1: protect the foundation

Check for:

- broken routes
- broken links
- hydration issues
- invalid HTML
- confusing or unusable mobile layouts

If any of those exist, fix them first.

### Step 2: improve traffic-entry pages

Prefer work on:

- `/guides/...`
- `/fees/...`
- `/sizer-rules`
- `/best-cards`
- homepage messaging and routing to high-value pages

Reason: these are likely to become stronger traffic drivers sooner than airline pages alone.

### Step 3: strengthen authority pages

Improve:

- `/airlines`
- `/airlines/[slug]`
- `/airlines/[slug]/how-to-beat-fees`

Focus especially on the priority airlines:

- United
- Delta
- American
- Southwest
- JetBlue
- Alaska
- Spirit
- Frontier
- Ryanair
- EasyJet

### Step 4: build monetization bridges carefully

Only build or expand monetization paths when they are:

- useful
- explainable
- route-consistent
- linked from relevant informational pages

### Step 5: reject low-value work

If the proposed task would mostly create:

- filler copy
- duplicate pages
- shallow coverage
- weak internal-link value
- vague affiliate content

do not do it.

## Default Operating Heuristics For Future Agents

- Be opinionated when the evidence supports an opinion.
- Be careful when the evidence is thin.
- Prefer stronger existing pages over random new ones.
- Favor expert synthesis over policy paraphrase.
- Link users toward the next useful decision.
- Keep tools trustworthy.
- Treat the site as a focused traveler-help product, not a content farm.

When in doubt, choose the change that most increases:

`authority + information gain + internal-link usefulness + deterministic monetization`

and avoid the change that merely increases page count.
