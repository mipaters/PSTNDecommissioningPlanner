# LegacyLift

AI-powered PSTN/TDM decommissioning planner for a Canadian Tier-1 telco (default carrier name "Maple Telecom"). A front-end-only demo: React 18 + Vite + TypeScript, Tailwind, Recharts, react-leaflet, React Flow, Zustand, framer-motion.

> All data is synthetic. The AI is a scripted, streaming mock. No backend, no secrets.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest (finance + planner)
npm run build    # production build in dist/
```

Set `VITE_CARRIER_NAME` (see `.env.example`) to rebrand. Reset the demo from the header at any time.

Keyboard: `←` / `→` step the walkthrough, `C` toggles the Copilot.

## Pages

Walkthrough · Dashboard · Network Map · Dependency Explorer · Wave Planner · Copilot (side panel) · Agents · Scenarios A–F · Architecture · Business Case.

## Demo script (10 minutes)

1. **0:00 Walkthrough** – open the app, turn on Presenter notes, step through slides 1–2 with `→`. Message: 1.2M lines, 42 switches, vendors exiting.
2. **1:30 Dashboard** – burn-down, savings ramp, segments. Point to the "critical services at risk" tile.
3. **3:00 Network Map** – click Thunder Bay; show the AI "why" panel. Then Kingston for hidden dependencies.
4. **4:00 Copilot** – press `C`, click the suggested prompt "Which switch should we retire first?" and watch the streamed answer with sources.
5. **5:00 Dependency Explorer** – filter to Sudbury (640 copper-only 911 lines) and Kingston (214 alarm circuits).
6. **6:00 Wave Planner** – note the manual baseline, click **Optimize waves**, show the reasoning log and NPV/payback deltas. Save a scenario with different crews and compare.
7. **7:30 Agents** – run Discovery; approve the Thunder Bay CRTC notice in the queue; show the audit trail.
8. **8:30 Business Case** – flip the ramp between Aggressive and Conservative; show the tornado.
9. **9:30 Architecture + roadmap** – toggle "Integrates with existing platform"; close on the 30-day discovery → 3-CO pilot → scale roadmap (Walkthrough step 7).

Scenarios A–F (`/scenarios`) give self-contained persona stories if you want to go deeper.

## Notes

- Synthetic data is generated in TypeScript (`src/data/cos.ts`, seeded RNG) rather than static JSON files, so derived scores stay consistent.
- Headline numbers come from real model code and may differ slightly from the rounded figures in scenario copy.
- Swap in Azure OpenAI by replacing `askCopilot` in `src/services/ai.ts` (see `docs/architecture.md`).
- Deploy to Azure Static Web Apps with `.github/workflows/azure-static-web-apps-victorious-beach-046a0290f.yml` (needs the `AZURE_STATIC_WEB_APPS_API_TOKEN_VICTORIOUS_BEACH_046A0290F` secret).

See `docs/architecture.md` and `docs/kpis.md`.
