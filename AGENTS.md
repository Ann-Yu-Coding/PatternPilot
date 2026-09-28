# Instructions for AI coding agents

1. **Read [`docs/product.md`](docs/product.md) before making any change.** It is the source of truth for goals, the current milestone, scope, error pattern rules and UI direction.
2. Work only on what the current milestone (§3 in product.md) asks for. **Don't add backend or infrastructure features unless explicitly asked.**
3. Follow the UI direction in product.md §7. Avoid generic "AI SaaS" styling.
4. Never expose correct answers or diagnostic metadata through public APIs. Keep the existing tests passing.
5. If a change involves a product decision, say so, so it can be recorded in the decision log (product.md §10).

For running, testing and database operations, see [`replit.md`](replit.md) and [`docs/step-3-postgres.md`](docs/step-3-postgres.md).
