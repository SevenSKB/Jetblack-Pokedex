# AI helper for "Ask the Dex"

This folder holds a small Cloudflare Worker. When it's switched on, the Pokédex's "Ask the Dex" chat sends each question to an AI model along with the JetBlack records that match it (Pokémon, moves, areas, trainers, items). The model is told to answer only from those records. Each answer shows the records it used, so readers can check it.

If the Worker isn't set up, or it hits the daily free limit, the chat falls back to the rule-based answers. Nothing breaks.

## Cost

It runs on the Cloudflare Workers AI free allocation: 10,000 "Neurons" a day, reset at 00:00 UTC. A typical question here uses roughly 100 Neurons with the default model, so expect on the order of 100 AI answers a day. Repeated questions are cached and cost nothing. Check [Cloudflare's pricing page](https://developers.cloudflare.com/workers-ai/platform/pricing/) for current numbers.

No credit card is needed for the free plan. If the allocation runs out, the Worker stops answering until the next day. It doesn't bill you unless you upgrade to the paid Workers plan yourself.

## Setup (one time, about 10 minutes)

### Option A: Cloudflare dashboard (no installs)

1. Create a free account at https://dash.cloudflare.com/sign-up.
2. Go to **Workers & Pages** → **Create** → **Create Worker**. Name it `jetblack-dex-ai` and click **Deploy**.
3. Click **Edit code**, delete the sample code, paste the contents of `worker.js`, and click **Deploy**.
4. Open the Worker's **Settings**:
   - **Bindings** → **Add** → **Workers AI**, variable name `AI`.
   - **Variables and Secrets** → add `MODEL` = `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
   - and `ALLOWED_ORIGINS` = `https://sevenskb.github.io` (add any other address the site runs on, comma-separated).
5. Copy the Worker's address, e.g. `https://jetblack-dex-ai.YOUR-NAME.workers.dev`.

### Option B: command line

```sh
cd ai-worker
npx wrangler login
npx wrangler deploy
```

The address is printed at the end. `wrangler.toml` already sets the AI binding and variables.

## Switch it on in the site

In `index.html`, put the Worker address in this line:

```html
<script>window.JB_AI_URL='https://jetblack-dex-ai.YOUR-NAME.workers.dev';</script>
```

Commit and push. The chat header changes to "AI answers, grounded in JetBlack data".

## Things to know

- The AI can still occasionally misread the data. That's why every answer shows "JetBlack data used" and tells readers to trust the data if the two disagree.
- It only knows what the site sends it, so it can't answer questions the data doesn't cover (for example trainer AI behaviour or exact damage numbers).
- `ALLOWED_ORIGINS` stops other websites from using your Worker from a browser. It can't stop someone calling it from a script, so the per-visitor limit (12 questions a minute) and the daily free cap are the real safety net.
- To turn the AI off, set `window.JB_AI_URL=''` again.
