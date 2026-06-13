"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ListingForm({ initial }) {
  const router = useRouter();
  const editing = !!initial;
  const [photos, setPhotos] = useState(initial?.photos?.map((p) => p.url) || []);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  async function onUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr("");
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) return setErr(data.error || "Upload failed.");
    setPhotos((p) => [...p, ...data.urls]);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    body.photos = photos;
    body.runFlat = form.get("runFlat") === "on"; // checkbox → explicit boolean

    const url = editing ? `/api/listings/${initial.id}` : "/api/listings";
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      if (data.code === "subscription_required" || data.code === "become_seller") {
        router.push("/subscribe");
        return;
      }
      return setErr(data.error || "Could not save listing.");
    }
    router.push(editing ? `/listings/${initial.id}` : `/listings/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {err && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/30">{err}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Brand</label>
          <input name="brand" required defaultValue={initial?.brand} className="input" placeholder="Michelin" />
        </div>
        <div>
          <label className="label">Size</label>
          <input name="size" required defaultValue={initial?.size} className="input" placeholder="225/45R17" />
        </div>
        <div>
          <label className="label">Quantity</label>
          <input name="quantity" type="number" min="1" defaultValue={initial?.quantity ?? 4} className="input" />
        </div>
        <div>
          <label className="label">Condition</label>
          <select name="condition" defaultValue={initial?.condition || "used"} className="input">
            <option value="new">New</option>
            <option value="used">Used</option>
          </select>
        </div>
        <div>
          <label className="label">Tread depth <span className="text-slate-400">(optional)</span></label>
          <input name="treadDepth" defaultValue={initial?.treadDepth || ""} className="input" placeholder="8/32in" />
        </div>
        <div>
          <label className="label">Price (USD)</label>
          <input
            name="price"
            type="number"
            min="1"
            step="0.01"
            required
            defaultValue={initial ? (initial.priceCents / 100).toString() : ""}
            className="input"
            placeholder="320"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Location</label>
          <input name="location" required defaultValue={initial?.location} className="input" placeholder="Dallas, TX" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Description <span className="text-slate-400">(optional)</span></label>
          <textarea name="description" rows={3} defaultValue={initial?.description || ""} className="input" placeholder="Set of 4, mounted one season, no patches…" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-3 text-sm font-bold text-slate-200">Tire details <span className="font-normal text-slate-400">— help buyers find the right fit</span></p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Season</label>
            <select name="season" defaultValue={initial?.season || ""} className="input">
              <option value="">—</option>
              <option value="all-season">All-season</option>
              <option value="summer">Summer</option>
              <option value="winter">Winter</option>
              <option value="all-weather">All-weather</option>
            </select>
          </div>
          <div>
            <label className="label">Load index</label>
            <input name="loadIndex" defaultValue={initial?.loadIndex || ""} className="input" placeholder="91" />
          </div>
          <div>
            <label className="label">Speed rating</label>
            <input name="speedRating" defaultValue={initial?.speedRating || ""} className="input" placeholder="V" maxLength={3} />
          </div>
          <div>
            <label className="label">DOT year <span className="text-slate-400">(mfg.)</span></label>
            <input name="dotYear" type="number" min="2000" max="2030" defaultValue={initial?.dotYear || ""} className="input" placeholder="2022" />
          </div>
          <label className="flex items-center gap-2 self-end pb-2.5 text-sm text-slate-200 sm:col-span-2">
            <input type="checkbox" name="runFlat" defaultChecked={initial?.runFlat} className="h-4 w-4 rounded border-white/20 bg-white/10 accent-brand-500" />
            Run-flat tires
          </label>
        </div>
      </div>

      <div>
        <label className="label">Photos</label>
        <input type="file" accept="image/*" multiple onChange={onUpload} className="block text-sm" />
        {uploading && <p className="mt-1 text-sm text-slate-500">Uploading…</p>}
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((url) => (
              <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                  className="absolute right-0 top-0 grid h-5 w-5 place-items-center rounded-bl bg-black/60 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={initial?.status || "active"} className="input max-w-xs">
            <option value="active">Active</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <button disabled={saving || uploading} className="btn-primary">
          {saving ? "Saving…" : editing ? "Save changes" : "Publish listing"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
}
