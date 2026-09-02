"use client";

import { useMemo, useState } from "react";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function NumberField({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (value: number) => void; min?: number }) {
  return (
    <label className="text-sm font-bold text-slate-800">
      {label}
      <input type="number" min={min} step="1" value={value} onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-normal" />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

export function BasicEconomyDecisionTool() {
  const [travelers, setTravelers] = useState(2);
  const [directions, setDirections] = useState(2);
  const [bundleDifference, setBundleDifference] = useState(45);
  const [carryOnFee, setCarryOnFee] = useState(50);
  const [checkedBagFee, setCheckedBagFee] = useState(45);
  const [seatFee, setSeatFee] = useState(20);
  const [needsCarryOn, setNeedsCarryOn] = useState(true);
  const [checksBag, setChecksBag] = useState(false);
  const [needsSeat, setNeedsSeat] = useState(true);
  const [bundleIncludesCarryOn, setBundleIncludesCarryOn] = useState(true);
  const [bundleIncludesCheckedBag, setBundleIncludesCheckedBag] = useState(false);
  const [bundleIncludesSeat, setBundleIncludesSeat] = useState(true);

  const result = useMemo(() => {
    const multiplier = travelers * directions;
    const basicAddOns = multiplier * ((needsCarryOn ? carryOnFee : 0) + (checksBag ? checkedBagFee : 0) + (needsSeat ? seatFee : 0));
    const bundleAddOns = multiplier * ((needsCarryOn && !bundleIncludesCarryOn ? carryOnFee : 0) + (checksBag && !bundleIncludesCheckedBag ? checkedBagFee : 0) + (needsSeat && !bundleIncludesSeat ? seatFee : 0));
    const bundleExtra = multiplier * bundleDifference + bundleAddOns;
    return { basicAddOns, bundleExtra, difference: basicAddOns - bundleExtra };
  }, [bundleDifference, bundleIncludesCarryOn, bundleIncludesCheckedBag, bundleIncludesSeat, carryOnFee, checkedBagFee, checksBag, directions, needsCarryOn, needsSeat, seatFee, travelers]);

  const bundleWins = result.difference > 0;
  const tie = result.difference === 0;

  return (
    <section id="basic-economy-tool" className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
      <div className="max-w-3xl">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Basic fare vs bundle calculator</div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">Does the bundle cost less after bags and seats?</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          Enter the prices shown for your flight. The comparison multiplies every per-person, per-direction charge explicitly; it does not estimate airline prices or assign a hidden score.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="grid gap-4 rounded-2xl border border-blue-100 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField label="Travelers" value={travelers} min={1} onChange={setTravelers} />
            <label className="text-sm font-bold text-slate-800">
              Trip
              <select value={directions} onChange={(event) => setDirections(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-normal">
                <option value={1}>One way</option>
                <option value={2}>Round trip</option>
              </select>
            </label>
            <NumberField label="Bundle price difference, each way ($)" value={bundleDifference} onChange={setBundleDifference} />
            <NumberField label="Carry-on fee, each way ($)" value={carryOnFee} onChange={setCarryOnFee} />
            <NumberField label="Checked-bag fee, each way ($)" value={checkedBagFee} onChange={setCheckedBagFee} />
            <NumberField label="Seat fee, each way ($)" value={seatFee} onChange={setSeatFee} />
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900">What this trip needs</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Check label="Carry-on" checked={needsCarryOn} onChange={setNeedsCarryOn} />
              <Check label="Checked bag" checked={checksBag} onChange={setChecksBag} />
              <Check label="Seat choice" checked={needsSeat} onChange={setNeedsSeat} />
            </div>
          </div>

          <div>
            <div className="text-sm font-bold text-slate-900">What the bundle includes</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <Check label="Carry-on" checked={bundleIncludesCarryOn} onChange={setBundleIncludesCarryOn} />
              <Check label="Checked bag" checked={bundleIncludesCheckedBag} onChange={setBundleIncludesCheckedBag} />
              <Check label="Seat choice" checked={bundleIncludesSeat} onChange={setBundleIncludesSeat} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Basic-fare add-ons</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{money(result.basicAddOns)}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Bundle premium + remaining add-ons</div>
              <div className="mt-2 text-2xl font-black text-slate-950">{money(result.bundleExtra)}</div>
            </div>
          </div>
          <div className={`mt-4 rounded-xl border p-4 ${tie ? "border-slate-200 bg-slate-50" : bundleWins ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
            <div className="text-xl font-black text-slate-950">
              {tie ? "The prices tie" : bundleWins ? `The bundle is ${money(result.difference)} cheaper` : `Basic is ${money(Math.abs(result.difference))} cheaper`}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {bundleWins ? "The included add-ons cost more separately than the bundle upgrade. Check that the bundle applies to every flight segment before buying." : "Basic wins on the entered prices. Choose it only if its seat, boarding, earning, and change restrictions still work for the trip."}
            </p>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Assumption: all entered prices apply per traveler and per direction. Fare differences, taxes, route exceptions, status benefits, and card benefits are not inferred.
          </p>
        </div>
      </div>
    </section>
  );
}
