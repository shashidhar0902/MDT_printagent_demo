# PrintAgent AI

A working prototype for smart campus print ordering. Students upload one or more PDFs, describe what they need in natural language, get a parsed quote, confirm with mock payment, and the job appears on an operator queue dashboard.

## Local setup

### Requirements

- Node.js 18 or newer
- npm
- A Windows laptop running the app
- Optional: a Gemini API key for natural-language instruction parsing

### Install dependencies

```bash
npm install
```

### Configure Gemini

1. Open [Google AI Studio API keys](https://aistudio.google.com/api-keys).
2. Create or copy a Gemini API key.
3. Create the local environment file from the project root:

PowerShell:

```powershell
Copy-Item .env.local.example .env.local
```

4. Open `.env.local` and add the key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

The key is used only by the server-side instruction agent in `lib/gemini.ts`.
Never add it to client-side code, commit it, or paste it into this README.

If `GEMINI_API_KEY` is empty, the app uses its basic local regex fallback.

Verify the key independently before starting the app:

```bash
npm run test:gemini
```

The test sends one small request to Gemini and prints only the result, never the key.

### Start locally

For use only on the laptop:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port 3000 is busy, Next.js will choose another port and print it in the terminal.

To allow students on the same college Wi-Fi to connect, bind the server to all network interfaces:

```powershell
npm run dev -- -H 0.0.0.0
```

Find the laptop's Wi-Fi IPv4 address:

```powershell
ipconfig
```

Students should open this address in their browsers, replacing the example address with the laptop's IPv4 address:

```text
http://192.168.1.25:3000
```

Allow Node.js through Windows Firewall on private networks if Windows prompts you. The laptop must remain awake, connected to Wi-Fi, and running the development server. Some college networks isolate Wi-Fi clients; in that case, other students cannot reach the laptop directly.

### Commit safety

`.env.local` and local data under `data/` are excluded by `.gitignore`. Before committing, check that the environment file is ignored:

```powershell
git check-ignore .env.local
```

This should print `.env.local`. Commit `.env.local.example`, but leave its value empty.

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
- **Google Gemini** for intent parsing (regex fallback if no API key)
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
