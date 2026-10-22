# KNOWN_LIMITATIONS
- No server-side scheduler: digest "scheduled time" is stored UI configuration; dispatch is manual (no cron/job code found).
- Behaviour incidents and digest config/history are memory-only (lost on reload).
- Subscription `maxStudents`/`maxUsers` stored but not enforced; no payment integration (renew marks `lastPaymentAt` manually).
- Per-process state: PDF concurrency counter, 15 s subscription cache, tenant doc cache.
- Excuse attachments inline in Firestore (size-limited).
- WhatsApp: text only; `web_direct` mode needs human send.
- `preferredModel` unused; AI model IDs unverified; AI output unverified.
- Client "offline sync" UI exists (`OfflineSyncModal`); true offline write queue behaviour is **UNKNOWN** (Firestore SDK persistence settings not set in `firebase.ts`).
- Not verified: `npm audit`, rules tests, emulator smoke, runtime with real services, visual/UI behaviour, internals of most UI components.
