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
3. Review the parsed spec (editable), click **Confirm & Pay (Mock)**
4. See cost + mock UPI reference
5. Switch to `/queue` — job appears at top if urgent

## Tech stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Anthropic Claude** for intent parsing (regex fallback if no API key)
- **pdf-lib** for PDF page counting
- **JSON file store** (`data/jobs.json`) for the ledger/queue (SQLite planned upgrade)

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/parse` | POST | Upload PDF + instructions → page count + parsed spec |
| `/api/confirm` | POST | Confirm job → cost calc, ledger write, mock payment |
| `/api/queue` | GET | Current print queue |

## Planned upgrades (commit-by-commit)

- [ ] Swap JSON store → SQLite (`better-sqlite3`)
- [ ] Google Sheets ledger integration
- [ ] Real loading/error polish
- [ ] Operator status controls (mark as printing/done)
