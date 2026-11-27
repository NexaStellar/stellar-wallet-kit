# Candidate backlog

These are draft engineering tasks, not active Drips Wave issues. Confirm the
repository's Wave status and add issues through the Drips maintainer dashboard
only after approval. Assign complexity there; do not treat labels or point
estimates in this file as Wave configuration.

## Add event-specific listener types

Replace the broad `Function` callback API with event-specific callback
signatures so consumers receive the correct payload type for each wallet event.

Acceptance criteria:

- Type each event payload, including events that carry no data.
- Type `on` and `off` so a callback can only be registered for compatible
  events.
- Preserve the current runtime behavior and make listener removal reliable.
- Add compile-time examples and runtime tests for registration, emission, and
  removal.

## Add adapter tests for Freighter, Albedo, and Rabet

The current adapter-focused test file covers xBull; add isolated provider
contract tests for the other implemented adapters.

Acceptance criteria:

- Cover availability, connect/disconnect, transaction signing, and provider
  rejection for each adapter.
- Cover auth-entry signing only where the provider supports it.
- Test missing or malformed provider responses without relying on real browser
  extensions.
- Keep the suite deterministic and runnable in CI.

