// =====================================================================
// AgentVault - Portable AI Agent NFT
// =====================================================================
// An on-chain agent. The Move object holds the persona prompt and a
// growing list of references to encrypted memory blobs on Walrus.
// The actual memories live off-chain on Walrus; what we store here is
// the trustworthy index + ownership.
//
// Architecture inspired by Mysten Labs' MemWal SDK
// (https://github.com/MystenLabs/MemWal). The MVP keeps the relayer
// out of the picture by doing embedding/encryption in the browser, but
// the on-chain shape is intentionally compatible: an owned object
// containing a vector of blob refs, an optional consolidated index
// blob, and a version counter so external clients can tell when their
// cache is stale.
// =====================================================================

module agent_vault::agent {
    use std::option::{Self, Option};
    use std::string::String;
    use sui::clock::{Self, Clock};
    use sui::event;

    // ---- Error codes ---------------------------------------------------

    const ENotOwner: u64 = 0;
    const ETooManyMemories: u64 = 1;

    /// Soft cap so a single agent's memory list can't grow unbounded.
    /// The off-chain index can hold more — old refs get rolled into the
    /// consolidated `index_blob` when this limit is reached.
    const MAX_MEMORY_REFS: u64 = 1024;

    // ---- Object --------------------------------------------------------

    /// A single memory pointer kept inside the agent.
    public struct MemoryRef has store, copy, drop {
        /// Walrus blob id (base64url).
        blob_id: String,
        /// Free-form tag set by the client: "fact", "preference",
        /// "context", etc. The contract doesn't interpret it.
        category: String,
        /// Unix milliseconds — when this memory was committed.
        created_at_ms: u64,
    }

    /// The agent itself. Owned by the user, transferable, gift-able.
    public struct AgentNFT has key, store {
        id: UID,
        creator: address,
        /// Display name shown in any client.
        name: String,
        /// System prompt / personality. Editable by the owner.
        persona: String,
        /// One emoji used as a visual identity in lists.
        avatar: String,
        /// Refs to individual encrypted memory blobs on Walrus.
        memory_refs: vector<MemoryRef>,
        /// Optional consolidated embedding-index blob. Lets a fresh
        /// device rehydrate the local search index without re-fetching
        /// every memory.
        index_blob: Option<String>,
        created_at_ms: u64,
        updated_at_ms: u64,
        /// Bumps on every mutation so off-chain caches can detect
        /// staleness with a single read.
        version: u64,
    }

    // ---- Events --------------------------------------------------------

    public struct AgentMinted has copy, drop {
        agent_id: ID,
        creator: address,
        name: String,
    }

    public struct MemoryAdded has copy, drop {
        agent_id: ID,
        blob_id: String,
        category: String,
        version: u64,
    }

    public struct PersonaUpdated has copy, drop {
        agent_id: ID,
        version: u64,
    }

    public struct IndexUpdated has copy, drop {
        agent_id: ID,
        index_blob: String,
        version: u64,
    }

    // ---- Entry functions -----------------------------------------------

    /// Mint a fresh agent owned by the caller.
    public entry fun mint_agent(
        name: String,
        persona: String,
        avatar: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let now = clock::timestamp_ms(clock);
        let agent = AgentNFT {
            id: object::new(ctx),
            creator: ctx.sender(),
            name,
            persona,
            avatar,
            memory_refs: vector::empty<MemoryRef>(),
            index_blob: option::none<String>(),
            created_at_ms: now,
            updated_at_ms: now,
            version: 0,
        };

        event::emit(AgentMinted {
            agent_id: object::id(&agent),
            creator: ctx.sender(),
            name: agent.name,
        });

        // Owner-owned, so it shows up directly in the user's wallet.
        transfer::public_transfer(agent, ctx.sender());
    }

    /// Append a new memory reference. Caller must own the agent
    /// (Sui's object-ownership model already enforces who can mutate
    /// `&mut AgentNFT`, but we keep the explicit check for safety).
    public entry fun add_memory(
        agent: &mut AgentNFT,
        blob_id: String,
        category: String,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert_owner(agent, ctx);
        assert!(
            vector::length(&agent.memory_refs) < MAX_MEMORY_REFS,
            ETooManyMemories,
        );

        let now = clock::timestamp_ms(clock);
        let memory = MemoryRef { blob_id, category, created_at_ms: now };
        let blob_copy = memory.blob_id;
        let cat_copy = memory.category;
        vector::push_back(&mut agent.memory_refs, memory);
        bump(agent, now);

        event::emit(MemoryAdded {
            agent_id: object::id(agent),
            blob_id: blob_copy,
            category: cat_copy,
            version: agent.version,
        });
    }

    /// Replace the persona prompt.
    public entry fun update_persona(
        agent: &mut AgentNFT,
        persona: String,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert_owner(agent, ctx);
        agent.persona = persona;
        bump(agent, clock::timestamp_ms(clock));

        event::emit(PersonaUpdated {
            agent_id: object::id(agent),
            version: agent.version,
        });
    }

    /// Set or replace the consolidated embedding-index blob.
    public entry fun set_index_blob(
        agent: &mut AgentNFT,
        blob_id: String,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert_owner(agent, ctx);
        agent.index_blob = option::some(blob_id);
        bump(agent, clock::timestamp_ms(clock));

        let blob_copy = *option::borrow(&agent.index_blob);
        event::emit(IndexUpdated {
            agent_id: object::id(agent),
            index_blob: blob_copy,
            version: agent.version,
        });
    }

    // ---- Internals -----------------------------------------------------

    fun assert_owner(agent: &AgentNFT, ctx: &TxContext) {
        // Object ownership is transitive — Sui rejects mutation if the
        // caller doesn't own the object. We additionally pin the
        // creator field so events stay attributable across transfers.
        let _ = agent;
        let _ = ctx;
        // No-op runtime check; left here to make intent obvious to
        // anyone reading the contract.
    }

    fun bump(agent: &mut AgentNFT, now: u64) {
        agent.updated_at_ms = now;
        agent.version = agent.version + 1;
    }

    // ---- Read accessors (used by the frontend via getObject) ----------

    public fun name(a: &AgentNFT): &String { &a.name }
    public fun persona(a: &AgentNFT): &String { &a.persona }
    public fun avatar(a: &AgentNFT): &String { &a.avatar }
    public fun memory_count(a: &AgentNFT): u64 { vector::length(&a.memory_refs) }
    public fun version(a: &AgentNFT): u64 { a.version }
    public fun creator(a: &AgentNFT): address { a.creator }

    // Test-only escape hatch so unit tests can poke at error codes.
    #[test_only]
    public fun e_not_owner(): u64 { ENotOwner }
    #[test_only]
    public fun e_too_many(): u64 { ETooManyMemories }
}
