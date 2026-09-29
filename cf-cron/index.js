// TireKind cron runner (L612). Calls the app's bearer-gated cron routes on schedule.
const JOBS = { "5 14 * * *": "/api/cron/alerts", "5 3 * * *": "/api/cron/purge" };
const ORIGIN = "https://tirekind.com";

export default {
  async scheduled(event, env, ctx) {
    const path = JOBS[event.cron];
    if (!path) throw new Error(`no job for cron ${event.cron}`);
    const res = await fetch(ORIGIN + path, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}`, "user-agent": "tirekind-cron" },
    });
    const body = (await res.text()).slice(0, 300);
    console.log(`${path} -> ${res.status} ${body}`);
    if (!res.ok) throw new Error(`${path} failed: ${res.status}`); // shows as a failed invocation
  },
};
