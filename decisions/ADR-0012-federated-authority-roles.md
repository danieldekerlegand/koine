# ADR-0012 — Authority roles may federate without becoming dependencies

**Status:** Accepted (2026-08-23)
**Deciders:** ecosystem owner
**Supersedes as the decision source:** KINP §11 decision 1 (canonical identity authority), KCB §8 open question 1 (registry federation), and KMI §9 open question 3 (CAS operational model).
**Applies to:** every participant acting as an authority, producer, consumer, or host.
**Numbering note:** ADR-0002 – ADR-0004 are reserved for deployment-history records that live downstream (see [`README.md`](README.md)); this record takes the next free agnostic number.

---

## Context

Three planes make the same choice at different surfaces. KINP designates one participant in the identity-authority role as canonical for real-world entities; KCB asks whether discovery has one registry or peer registries; and KMI asks whether content-addressed assets have one store or stores that replicate when referenced. Each is an instance of one question: whether an authority is a permanently privileged dependency, or a role that can be held by more than one peer.

The single-role form has real advantages. A canonical identity authority gives reconciliation one convergence point; a single registry gives discovery one readily inspected record; and one asset authority avoids replication decisions. KINP already preserves the important limit: identifiers are minted locally and reconciliation is eventually consistent, so a producer does not need to reach that authority in order to work offline.

The alternative is fully federated peers with no privileged node. It removes a single role holder as the apparent center and lets authority domains operate independently. But it does not remove the work: peers must state which authority's assertion they use, reconcile conflicting assertions, and make discovery and referenced bytes available across authority boundaries. Calling those obligations "peer-to-peer" without specifying their shape merely moves them into incompatible implementations.

## Options considered

### Option (a) — Keep one permanently privileged authority

Keep one canonical identity authority, one discovery registry, and one content-addressed store as hard dependencies for the fabric.

**For.** One place to inspect each kind of record and no cross-authority reconciliation protocol.

**Against.** A producer could not safely continue when that authority is unreachable, and a second authority could only exist as an out-of-band exception. That contradicts KINP's local, offline-first minting model and makes the role a topology requirement rather than a contract role.

*Rejected.*

### Option (b) — Fully federated peers with no distinguished authority role

Treat every peer as interchangeable immediately; no role holder is canonical, and each peer decides identity, discovery, and byte availability independently.

**For.** No peer is structurally privileged, and independent authority domains can begin without a central designation.

**Against.** It discards the convergence and quality boundary the current single-role form supplies. More importantly, it leaves no shared answer for reconciliation, discovery, or replication: every consumer would have to invent its own choice of peer and conflict policy. Federation would be a name for unspecified behavior, not interoperability.

*Rejected.*

### Option (c) — Authority is a role today; federation composes role holders later

Keep the existing single-authority role where a participant designates one, while defining federation as an additive composition of independently operating holders of that role. A federation identifies the authority whose assertion or address it is using and defines the reconciliation or replication edge between holders; it does not turn an authority into a mandatory online minting service.

*Accepted.*

## Decision

**An authority is a role, not a hard dependency.** A conformant participant MAY designate one holder of an authority role as canonical within its authority domain. When more than one holder is needed, the holders form federated peers: each remains authoritative for what it issues or serves, and the inter-authority contract carries enough authority identity and scope to select, reconcile, or obtain that holder's result.

Federation changes neither the right to mint local identifiers nor the offline-first rule. A producer MUST be able to mint a local identifier without reaching an identity authority; reconciliation may happen later. Likewise, an unavailable registry or asset authority may delay discovery or retrieval, but must not redefine locally minted identity or require its prior approval.

This record decides **contract shape**, not a deployment. It does not prescribe how many role holders exist, how they are located, how they exchange records, or when federation is enabled. It also does not alter ADR-0001: discovery may return an address or authority reference, but an authority role is not a data-plane relay between participants.

The future plane-specific clauses must be additive: the existing single-holder behavior stays valid; the federation form adds authority-boundary information and cross-authority handling rather than redefining identifiers, envelopes, direct peer communication, or local minting.

## Consequences

- A single authority role remains a valid and useful initial form. It is a selected role holder, not a claim that only one holder can ever exist.
- A federated form must make the authority boundary observable wherever a consumer needs to choose or evaluate an assertion, endpoint, or referenced asset.
- The later pressure test must actively seek these hazards without assuming a particular deployment: cross-authority `same_as` reconciliation that over-merges or bypasses the `based_on` firewall; registry peering that returns stale, conflicting, or unresolvable authority records; and per-project CAS replication on reference that loses content identity, provenance, or availability semantics.
- This record supplies the one decision source only. The plane-specific application belongs to the follow-up edits, where each spec can state its own fields and conformance behavior.
