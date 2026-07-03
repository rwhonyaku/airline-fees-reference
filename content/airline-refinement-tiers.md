# Airline Refinement Tiers

Use this order when a future request asks for airline refinements by batch or tier.

Current progress: completed through Tier 3L. No next airline tier is defined.

## Tier 1A: highest commercial and search priority

- United
- Delta
- American
- Southwest
- JetBlue

## Tier 1B: high-priority fee-trap and comparison airlines

- Alaska
- Spirit
- Frontier
- Ryanair
- easyJet

## Tier 2A: global full-service airlines with strong baggage search demand

- Air Canada
- Air France
- Lufthansa
- Singapore Airlines
- Air India

## Tier 2B: international comparison airlines

- EVA Air
- British Airways
- KLM
- Emirates
- Qatar Airways

## Tier 2C: additional long-haul network airlines

- Turkish Airlines
- Cathay Pacific
- ANA
- Japan Airlines
- Korean Air

## Tier 3A: remaining active airline pages, first priority

- Aer Lingus
- Aeromexico
- Air New Zealand
- Qantas
- TAP Air Portugal

## Tier 3B: remaining active airline pages, next priority

- Avianca
- Copa Airlines
- Iberia
- LATAM
- WestJet

## Tier 3C: remaining active airline pages, next priority

- Virgin Australia
- Iberia Express
- Norwegian
- Saudia
- Vueling

## Tier 3D: remaining active airline pages, next priority

- Jetstar
- Scoot
- AirAsia
- IndiGo
- Cebu Pacific

## Tier 3E: remaining active airline pages, next priority

- SpiceJet
- VietJet Air
- Volaris
- Viva Aerobus
- Jet2

## Tier 3F: remaining active airline pages, next priority

- Thai Airways
- Philippine Airlines
- Vistara
- Jetstar Asia
- Jetstar Japan

## Tier 3G: remaining active airline pages, next priority

- Etihad
- Gulf Air
- Oman Air
- flydubai
- EgyptAir

## Tier 3H: remaining active airline pages, next priority

- Ethiopian
- Royal Air Maroc
- Kenya Airways
- South African Airways
- SriLankan

## Tier 3I: remaining active airline pages, next priority

- Air China
- China Southern
- Hainan Airlines
- XiamenAir
- Air Astana

## Tier 3J: remaining weak-language cleanup

- AIX Connect
- Spring Airlines
- ZIPAIR

## Tier 3K: remaining active airline pages, next priority

- Asiana
- China Airlines
- China Eastern
- Hong Kong Airlines
- Malaysia Airlines

## Tier 3L: remaining active airline pages, final current batch

- Garuda Indonesia
- Vietnam Airlines
- Batik Air
- Wizz Air

## After Tier 3L

Do not create additional numbered airline tiers unless new airline pages are added to the dataset or the user explicitly defines a new tier.

Post-cleanup QA should be tracked separately from airline tiers and should not use Tier 3 labels.

## Operating rule

When the user says "next batch," continue from the last completed group in this list unless they name a different tier or airline set.
