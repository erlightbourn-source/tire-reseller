"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// "Share your listing to TikTok" page body. Follows TikTok's Content Sharing
// Guidelines (Direct Post): fresh creator info on render, nickname shown, privacy
// chosen manually with no default (options from creator_info), interactions off by
// default and greyed out when the creator disabled them (photo posts: comments
// only), commercial-content disclosure off by default with Your brand / Branded
// content, branded content never private, the consent declaration above the
// button, a preview of exactly what will be posted, nothing sent before Post, and
// status polling afterwards.

const PRIVACY_LABELS = {
  PUBLIC_TO_EVERYONE: "Everyone",
  MUTUAL_FOLLOW_FRIENDS: "Friends",
  FOLLOWER_OF_CREATOR: "Followers",
  SELF_ONLY: "Only me",
};
const MUSIC_URL = "https://www.tiktok.com/legal/page/global/music-usage-confirmation/en";
const BC_URL = "https://www.tiktok.com/legal/page/global/bc-policy/en";
const DISCLOSE_HINT = "You need to indicate if your content promotes yourself, a third party, or both.";
const BC_PRIVATE_HINT = "Branded content visibility cannot be set to private.";

const NOTICES = {
  connected: "Your TikTok account is connected.",
  cancelled: "TikTok connection was cancelled.",
  failed: "We couldn't connect to TikTok. Please try again.",
  expired: "That connection attempt expired. Please try again.",
  scopes: "TireKind needs permission to post to your TikTok account. Please reconnect and allow posting.",
};
const CAN_NOT_POST = {
  spam_risk_too_many_posts: "This TikTok account has reached its daily post limit. Please try again later.",
  spam_risk_user_banned_from_posting: "TikTok isn't allowing this account to post right now. Please try again later.",
  reached_active_user_cap: "TikTok's daily limit for TireKind has been reached. Please try again later.",
};
const STATUS_TEXT = {
  PROCESSING_DOWNLOAD: "TikTok is downloading your photos…",
  PROCESSING_UPLOAD: "TikTok is processing your post…",
  SEND_TO_USER_INBOX: "Sent to your TikTok inbox. Open the notification in the TikTok app to finish your post.",
  PUBLISH_COMPLETE: "Posted! It's on your TikTok profile.",
  FAILED: "TikTok couldn't publish this post.",
};

export default function TikTokShare({ listingId, photos, suggestion, notice }) {
  const [info, setInfo] = useState(null); // null = loading
  const [loadErr, setLoadErr] = useState("");

  const eligible = photos.filter((p) => p.eligible);
  const [selected, setSelected] = useState(() => eligible.map((p) => p.id));
  const [cover, setCover] = useState(eligible[0]?.id || null);
  const [mode, setMode] = useState("direct");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("");
  const [allowComment, setAllowComment] = useState(false);
  const [autoMusic, setAutoMusic] = useState(false);
  const [disclose, setDisclose] = useState(false);
  const [yourBrand, setYourBrand] = useState(false);
  const [branded, setBranded] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null); // { publishId, mode, status, failReason }
  const pollRef = useRef(null);

  async function loadCreator() {
    setLoadErr("");
    try {
      const r = await fetch("/api/tiktok/creator", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "error");
      setInfo(d);
    } catch {
      setLoadErr("Couldn't reach TikTok. Refresh to try again.");
      setInfo({ connected: false });
    }
  }
  useEffect(() => {
    loadCreator();
    return () => clearTimeout(pollRef.current);
  }, []);

  const creator = info?.creator;
  const order = useMemo(() => eligible.filter((p) => selected.includes(p.id)), [eligible, selected]);
  const coverIndex = Math.max(0, order.findIndex((p) => p.id === cover));

  function togglePhoto(id) {
    setSelected((s) => {
      const next = s.includes(id) ? s.filter((x) => x !== id) : [...s, id];
      if (!next.includes(cover)) setCover(eligible.find((p) => next.includes(p.id))?.id || null);
      return next;
    });
  }

  // Branded content can't be private: if "Only me" is picked, Branded content is off.
  useEffect(() => {
    if (privacy === "SELF_ONLY" && branded) setBranded(false);
  }, [privacy, branded]);

  const discloseOk = !disclose || yourBrand || branded;
  const direct = mode === "direct";
  const canSubmit =
    !busy &&
    !result &&
    info?.connected &&
    info?.canPost &&
    order.length > 0 &&
    (!direct || (privacy && discloseOk && !(branded && privacy === "SELF_ONLY")));

  let label = "";
  if (direct && disclose && branded) label = "Your photo will be labeled as 'Paid partnership'";
  else if (direct && disclose && yourBrand) label = "Your photo will be labeled as 'Promotional content'";

  async function disconnect() {
    await fetch("/api/tiktok/disconnect", { method: "POST" });
    setInfo({ connected: false });
    setResult(null);
  }

  async function poll(publishId, started) {
    try {
      const r = await fetch("/api/tiktok/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishId }),
      });
      const d = await r.json();
      if (d.ok) {
        setResult((x) => ({ ...x, status: d.status, failReason: d.failReason }));
        if (["PUBLISH_COMPLETE", "FAILED", "SEND_TO_USER_INBOX"].includes(d.status)) return;
      }
    } catch {
      /* keep polling */
    }
    if (Date.now() - started < 3 * 60_000) pollRef.current = setTimeout(() => poll(publishId, started), 4000);
  }

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/tiktok/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: true,
          listingId,
          mode,
          photoIds: order.map((p) => p.id),
          coverIndex,
          title,
          description,
          privacyLevel: privacy,
          allowComment,
          autoAddMusic: autoMusic,
          disclose,
          yourBrand,
          brandedContent: branded,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "TikTok couldn't accept the post.");
      setResult({ publishId: d.publishId, mode: d.mode, status: "PROCESSING_DOWNLOAD" });
      if (d.publishId) poll(d.publishId, Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {notice && NOTICES[notice] && (
        <div className="card p-3 text-sm text-slate-200" role="status">{NOTICES[notice]}</div>
      )}

      {/* Account */}
      <div className="card p-5">
        {info === null ? (
          <p className="text-sm text-slate-400">Checking your TikTok connection…</p>
        ) : !info.connected ? (
          <div>
            <h2 className="font-display text-lg font-bold text-white">Connect your TikTok account</h2>
            <p className="mt-1 text-sm text-slate-400">
              TikTok will ask you to log in and approve TireKind. We only use this connection to show which account
              you&apos;re posting to and to send the posts you create here. You can disconnect at any time.
            </p>
            {loadErr && <p className="mt-2 text-sm text-red-400">{loadErr}</p>}
            <a href={`/api/tiktok/connect?listing=${encodeURIComponent(listingId)}`} className="btn-primary mt-4 inline-flex">
              Continue with TikTok
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {creator?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-white/10" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-wide text-slate-400">Posting to TikTok as</div>
              <div className="truncate font-display font-bold text-white">{creator?.nickname || "Your TikTok account"}</div>
              {creator?.username && <div className="truncate text-sm text-slate-400">@{creator.username}</div>}
            </div>
            <button type="button" onClick={disconnect} className="btn-ghost px-3 py-1.5 text-sm">
              Disconnect
            </button>
          </div>
        )}
        {info?.connected && info.canPost === false && (
          <p className="mt-3 text-sm text-amber-300">
            {CAN_NOT_POST[info.reason] || "This TikTok account can't post right now. Please try again later."}
          </p>
        )}
      </div>

      {info?.connected && info.canPost && (
        <form onSubmit={submit} className="space-y-4">
          {/* Photos + preview */}
          <div className="card p-5">
            <label className="label">Photos</label>
            {eligible.length === 0 ? (
              <p className="text-sm text-slate-400">
                TikTok photo posts need JPG or WEBP photos. Add one to this listing first.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {photos.map((p) => {
                    const on = selected.includes(p.id);
                    return (
                      <div key={p.id} className={`relative ${p.eligible ? "" : "opacity-40"}`}>
                        <button
                          type="button"
                          disabled={!p.eligible}
                          onClick={() => togglePhoto(p.id)}
                          aria-pressed={on}
                          className={`block w-full border-2 ${on ? "border-brand-500" : "border-transparent"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt="" className="aspect-square w-full object-cover" />
                        </button>
                        {on && (
                          <button
                            type="button"
                            onClick={() => setCover(p.id)}
                            className={`absolute bottom-1 left-1 badge ${cover === p.id ? "bg-brand-500 text-black" : "bg-black text-slate-200"}`}
                          >
                            {cover === p.id ? "Cover" : "Set cover"}
                          </button>
                        )}
                        {!p.eligible && <span className="absolute left-1 top-1 badge bg-black text-slate-300">Not JPG/WEBP</span>}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-400">Tap a photo to include or remove it. {order.length} selected.</p>
                {order.length > 0 && (
                  <div className="mt-4">
                    <div className="label">Preview</div>
                    <div className="flex snap-x gap-2 overflow-x-auto pb-2">
                      {order.map((p, i) => (
                        <div key={p.id} className="relative w-28 shrink-0 snap-start">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt={`Photo ${i + 1}`} className="aspect-[3/4] w-full object-cover" />
                          <span className="absolute left-1 top-1 badge bg-black text-slate-200">
                            {i + 1}{i === coverIndex ? " · cover" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Caption */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <label className="label" htmlFor="tt-title">Title</label>
              <button
                type="button"
                className="text-xs text-brand-400 hover:underline"
                onClick={() => { setTitle(suggestion.title); setDescription(suggestion.description); }}
              >
                Use listing details
              </button>
            </div>
            <input id="tt-title" className="input" maxLength={90} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a title" />
            <div className="mt-1 text-right text-xs text-slate-500">{title.length}/90</div>
            <label className="label mt-3" htmlFor="tt-desc">Description</label>
            <textarea id="tt-desc" className="input min-h-[96px]" maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your tires, add #hashtags" />
            <div className="mt-1 text-right text-xs text-slate-500">{description.length}/4000</div>
          </div>

          {/* How to share */}
          <div className="card p-5">
            <div className="label">How to share</div>
            <label className="flex items-start gap-2 py-1 text-sm text-slate-200">
              <input type="radio" name="mode" checked={direct} onChange={() => setMode("direct")} className="mt-1" />
              <span>Post to my TikTok profile now</span>
            </label>
            <label className="flex items-start gap-2 py-1 text-sm text-slate-200">
              <input type="radio" name="mode" checked={!direct} onChange={() => setMode("draft")} className="mt-1" />
              <span>
                Send to my TikTok inbox as a draft
                <span className="block text-xs text-slate-400">You&apos;ll finish editing and posting in the TikTok app.</span>
              </span>
            </label>
          </div>

          {direct && (
            <>
              <div className="card p-5">
                <label className="label" htmlFor="tt-privacy">Who can view this post</label>
                <select id="tt-privacy" className="input" value={privacy} onChange={(e) => setPrivacy(e.target.value)} required>
                  <option value="" disabled>Select who can view</option>
                  {(creator?.privacyOptions || []).map((o) => {
                    const blocked = o === "SELF_ONLY" && disclose && branded;
                    return (
                      <option key={o} value={o} disabled={blocked} title={blocked ? BC_PRIVATE_HINT : undefined}>
                        {PRIVACY_LABELS[o] || o}{blocked ? " (not available for branded content)" : ""}
                      </option>
                    );
                  })}
                </select>

                <div className="label mt-4">Allow users to</div>
                <label className={`flex items-center gap-2 text-sm ${creator?.commentDisabled ? "text-slate-500" : "text-slate-200"}`}>
                  <input
                    type="checkbox"
                    checked={allowComment && !creator?.commentDisabled}
                    disabled={!!creator?.commentDisabled}
                    onChange={(e) => setAllowComment(e.target.checked)}
                  />
                  Comment{creator?.commentDisabled ? " (turned off in your TikTok settings)" : ""}
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm text-slate-200">
                  <input type="checkbox" checked={autoMusic} onChange={(e) => setAutoMusic(e.target.checked)} />
                  Add recommended music (you can change it later in TikTok)
                </label>
              </div>

              <div className="card p-5">
                <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                  <span>
                    <span className="font-bold text-white">Disclose post content</span>
                    <span className="block text-xs text-slate-400">
                      Turn on to disclose that this post promotes goods or services in exchange for something of value.
                      Your post could promote yourself, a third party, or both.
                    </span>
                  </span>
                  <input type="checkbox" role="switch" checked={disclose} onChange={(e) => { setDisclose(e.target.checked); if (!e.target.checked) { setYourBrand(false); setBranded(false); } }} />
                </label>
                {disclose && (
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
                    <label className="flex items-start gap-2 text-sm text-slate-200">
                      <input type="checkbox" className="mt-1" checked={yourBrand} onChange={(e) => setYourBrand(e.target.checked)} />
                      <span>Your brand<span className="block text-xs text-slate-400">You are promoting yourself or your own business.</span></span>
                    </label>
                    <label
                      className={`flex items-start gap-2 text-sm ${privacy === "SELF_ONLY" ? "text-slate-500" : "text-slate-200"}`}
                      title={privacy === "SELF_ONLY" ? BC_PRIVATE_HINT : undefined}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={branded}
                        disabled={privacy === "SELF_ONLY"}
                        onChange={(e) => setBranded(e.target.checked)}
                      />
                      <span>
                        Branded content
                        <span className="block text-xs text-slate-400">
                          You are promoting another brand or a third party.
                          {privacy === "SELF_ONLY" ? ` ${BC_PRIVATE_HINT}` : ""}
                        </span>
                      </span>
                    </label>
                    {label && <p className="text-sm text-brand-400">{label}</p>}
                    {!discloseOk && <p className="text-xs text-amber-300">{DISCLOSE_HINT}</p>}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Declaration + Post */}
          <div className="card p-5">
            <p className="text-sm text-slate-300">
              By posting, you agree to TikTok&apos;s{" "}
              {direct && disclose && branded && (
                <>
                  <a href={BC_URL} target="_blank" rel="noopener noreferrer" className="text-brand-400 underline">Branded Content Policy</a>{" and "}
                </>
              )}
              <a href={MUSIC_URL} target="_blank" rel="noopener noreferrer" className="text-brand-400 underline">Music Usage Confirmation</a>.
            </p>
            <span title={direct && disclose && !discloseOk ? DISCLOSE_HINT : undefined} className="mt-4 inline-block">
              <button type="submit" disabled={!canSubmit} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "Sending to TikTok…" : direct ? "Post to TikTok" : "Send to TikTok inbox"}
              </button>
            </span>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
            {result && (
              <div className="mt-4 border-t border-white/10 pt-3 text-sm" role="status">
                <p className="text-slate-200">
                  {result.mode === "direct"
                    ? "Sent to TikTok. It may take a few minutes for your post to process and appear on your profile."
                    : "Sent to TikTok. Check your TikTok inbox notifications to finish your post."}
                </p>
                <p className="mt-1 text-slate-400">
                  Status: {STATUS_TEXT[result.status] || result.status}
                  {result.status === "FAILED" && result.failReason ? ` (${result.failReason})` : ""}
                </p>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
