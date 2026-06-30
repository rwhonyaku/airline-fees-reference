export const SizerCheck = () => {
  return (
    <div className="my-8 rounded-xl border-2 border-orange-200 bg-orange-50 p-6">
      <h3 className="mb-2 text-xl font-bold text-orange-800">Sizer Reality Check</h3>
      <p className="mb-4 text-sm text-orange-700">
        Carry-on measurements usually include wheels and handles. A bag marketed as &quot;22 inches&quot; can still fail if the
        real outer shell runs tall or will not compress when gate staff starts enforcing size visually.
      </p>
      <div className="flex gap-4">
        <div className="flex-1 rounded bg-white p-3 text-center shadow-sm">
          <span className="block text-xs font-bold uppercase text-slate-500">Legacy-Carriers Baseline</span>
          <span className="text-lg font-mono font-bold text-slate-800">22 x 14 x 9 in</span>
        </div>
        <div className="flex-1 rounded bg-white p-3 text-center shadow-sm">
          <span className="block text-xs font-bold uppercase text-slate-500">Traveler Move</span>
          <span className="text-lg font-mono font-bold text-red-600">Measure the real shell</span>
        </div>
      </div>
    </div>
  );
};
