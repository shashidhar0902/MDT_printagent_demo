# PrintAgent AI

A working prototype for smart campus print ordering. Students upload one or more PDFs, describe what they need in natural language, get a parsed quote, confirm with mock payment, and the job appears on an operator queue dashboard.

## Quick start

```bash
npm install
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY (optional)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the student chat interface.  
Open [http://localhost:3000/queue](http://localhost:3000/queue) for the operator dashboard.

## Demo flow

1. Enter your name and drop one or more PDFs
2. Type instructions like: `3 copies, back to back, color, need it urgently`
3. Review the agent-generated print plan (editable), click **Confirm & Pay (Mock)**
4. Complete the mock payment; the job enters the queue
5. Open `/queue` and move each job through `printing`, `ready`, and `collected`

## Tech stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Anthropic Claude** for intent parsing (regex fallback if no API key)
- **pdf-lib** for PDF page counting
- **JSON file store** (`data/jobs.json`) for the ledger/queue (SQLite planned upgrade)

## Demo operating rules

- The total PDF upload limit is 100 MB and an order may contain at most 1,000 pages.
- The instruction agent extracts copies, color, sides, and urgency, then the machine agent routes color jobs to `color-1` and alternates B&W jobs between `bw-1` and `bw-2`.
- Mock payment queues every paid-in-demo order.
- Unpaid orders become `cancelled` after 10 minutes. Cancelled orders are removed after 10 hours when the app receives a request; localhost does not run a background scheduler.
- Operators can move jobs through `queued`, `printing`, `ready`, `collected`, or `cancelled`. Marking a job `collected` removes it from the ledger immediately.

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/parse` | POST | Upload PDF + instructions → page count + parsed spec |
| `/api/confirm` | POST | Confirm job → cost calc, ledger write, mock payment |
| `/api/queue` | GET | Current print queue |
| `/api/status` | POST | Operator status transition |

## Planned upgrades (commit-by-commit)

- [ ] Swap JSON store → SQLite (`better-sqlite3`)
- [ ] Google Sheets ledger integration
- [ ] Real loading/error polish
- [ ] Operator status controls (mark as printing/done)
