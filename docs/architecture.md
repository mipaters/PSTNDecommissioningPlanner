# Architecture

```mermaid
flowchart TB
  subgraph XP[Experience]
    UI[LegacyLift web app<br/>Azure Static Web Apps]
    TM[Teams / M365 Copilot]
  end
  subgraph AG[Agent orchestration]
    OR[Orchestrator]
    HI[Human approval gateway]
    A[7 agents: Discovery, Risk, Sequencing,<br/>Regulatory, Customer Migration, Cutover, Finance]
  end
  subgraph IN[Intelligence]
    AO[Azure OpenAI]
    AS[Azure AI Search - RAG]
    CS[Content Safety]
  end
  subgraph DP[Data platform]
    FB[Fabric OneLake]
    EH[Event Hubs - CDRs]
  end
  subgraph SR[Systems of record - read only]
    OSS[OSS / inventory]
    BSS[BSS / billing]
    PRV[Provisioning]
    GIS[GIS & facilities]
  end
  UI --> OR
  TM --> OR
  OR --> HI
  OR --> A
  A --> AO
  A --> AS
  A --> CS
  AO --> FB
  AS --> FB
  AS --> EH
  FB --> OSS
  FB --> BSS
  EH --> PRV
  FB --> GIS
```

## In this demo

There is no backend. All data is synthetic and generated in `src/data/cos.ts` (seeded RNG). The "AI" is a scripted, streaming mock in `src/services/ai.ts`. The planner (`src/lib/planner.ts`) and finance model (`src/lib/finance.ts`) are real, deterministic code.

## Swapping in Azure OpenAI

Replace the body of `askCopilot` in `src/services/ai.ts` with a call to your own API (for example an Azure Function that proxies Azure OpenAI with On-Your-Data against AI Search) and yield its streamed tokens as `AIChunk`s. Never put keys in the browser.
