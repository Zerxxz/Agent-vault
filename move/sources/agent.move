// =====================================================================
// AgentVault — Living Will Edition
// =====================================================================
// "A mind that outlives you."
//
// An on-chain agent NFT. The owner trains it through chat over time;
// memories live encrypted on Walrus and are referenced from this object.
// The new "inheritance" layer adds:
//
//   - heirs:               wallet addresses allowed to read after dormancy
//   - dormancy_threshold:  how long without owner activity before the
//                          off-chain client unlocks heir-mode
//   - per-memory visibility (private / heirs-visible)
//   - ping():              explicit owner check-in
//
// Dormancy itself isn't a flag stored on chain — it's computed off-chain
// as `now > updated_at_ms + dormancy_threshold_ms`. Every owner-only
// mutation (add_memory, ping, etc.) bumps `updated_at_ms`, so simply
// using the agent counts as "I'm alive".
// =====================================================================

module agent_vault::agent {
    use std::option::{Self, Option};
    use std::string::String;
    use sui::clock::{Self, Clock};
    use sui::event;

    // ---- Error codes ---------------------------------------------------

    const EHeirAlreadyAdded: u64 = 0;
    const EHeirNotFound: u64 = 1;
    const ETooManyHeirs: u64 = 2;
    const ETooManyMemories: u64 = 3;
    const EInvalidDormancy: u64 = 4;

    // ---- Limits & constants -------------------------------------------

    const MAX_HEIRS: u64 = 16;
    const MAX_MEMORY_REFS: u64 = 1024;
    /// 60 seconds — short enough that demos can show dormancy on testnet.
    const MIN_DORMANCY_MS: u64 = 60_000;
    /// ~50 years — generous upper bound.
    const MAX_DORMANCY_MS: u64 = 1_576_800_000_000;

    /// Memory visibility flags. Anything other than `V_PRIVATE` is
    /// stored as `V_HEIR_VISIBLE` so we don't end up with mystery values.
    const V_PRIVATE: u8 = 0;
    const V_HEIR_VISIBLE: u8 = 1;

    // ---- Object --------------------------------------------------------

    public struct MemoryRef has store, copy, drop {
        blob_id: String,
        category: String,
        created_at_ms: u64,
        /// 0 = owner-only forever; 1 = visible to heirs after dormancy.
        visibility: u8,
    }

    public struct AgentNFT has key, store {
        id: UID,
        creator: address,
        name: String,
        persona: String,
        avatar: String,
        memory_refs: vector<MemoryRef>,
        index_blob: Option<String>,

        /// Wallet addresses that may read this agent after dormancy.
        heirs: vector<address>,
        /// Milliseconds without owner activity before the agent becomes
        /// dormant. Off-chain clients compute the actual dormancy state
        /// from `updated_at_ms + dormancy_threshold_ms`.
        dormancy_threshold_ms: u64,

        created_at_ms: u64,
        updated_at_ms: u64,
        version: u64,
    }

    // ---- Events --------------------------------------------------------

    public struct AgentMinted has copy, drop {
        agent_id: ID,
        creator: address,
        name: String,
        dormancy_threshold_ms: u64,
    }

    public struct MemoryAdded has copy, drop {
        agent_id: ID,
        blob_id: String,
        category: String,
        visibility: u8,
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

    public struct AgentPinged has copy, drop {
        agent_id: ID,
        pinged_at_ms: u64,
    }

    public struct HeirAdded has copy, drop {
        agent_id: ID,
        heir: address,
    }

    public struct HeirRemoved has copy, drop {
        agent_id: ID,
        heir: address,
    }

    public struct DormancyChanged has copy, drop {
        agent_id: ID,
        threshold_ms: u64,
    }

    // ---- Entry functions -----------------------------------------------

    /// Mint a fresh agent owned by the caller. `dormancy_threshold_ms`
    /// is the silence window after which heirs can read.
    public entry fun mint_agent(
        name: String,
        persona: String,
        avatar: String,
        dormancy_threshold_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(
            dormancy_threshold_ms >= MIN_DORMANCY_MS &&
                dormancy_threshold_ms <= MAX_DORMANCY_MS,
            EInvalidDormancy,
        );

        let now = clock::timestamp_ms(clock);
        let agent = AgentNFT {
            id: object::new(ctx),
            creator: ctx.sender(),
            name,
            persona,
            avatar,
            memory_refs: vector::empty<MemoryRef>(),
            index_blob: option::none<String>(),
            heirs: vector::empty<address>(),
            dormancy_threshold_ms,
            created_at_ms: now,
            updated_at_ms: now,
            version: 0,
        };

        event::emit(AgentMinted {
            agent_id: object::id(&agent),
            creator: ctx.sender(),
            name: agent.name,
            dormancy_threshold_ms,
        });

        transfer::public_transfer(agent, ctx.sender());
    }

    /// Append a new memory reference. `visibility` is clamped to the
    /// known set of flags; anything other than `V_PRIVATE` becomes
    /// `V_HEIR_VISIBLE`.
    public entry fun add_memory(
        agent: &mut AgentNFT,
        blob_id: String,
        category: String,
        visibility: u8,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let _ = ctx;
        assert!(
            vector::length(&agent.memory_refs) < MAX_MEMORY_REFS,
            ETooManyMemories,
        );

        let v = if (visibility == V_PRIVATE) V_PRIVATE else V_HEIR_VISIBLE;
        let now = clock::timestamp_ms(clock);

        let memory = MemoryRef {
            blob_id,
            category,
            created_at_ms: now,
            visibility: v,
        };
        let blob_copy = memory.blob_id;
        let cat_copy = memory.category;
        vector::push_back(&mut agent.memory_refs, memory);
        bump(agent, now);

        event::emit(MemoryAdded {
            agent_id: object::id(agent),
            blob_id: blob_copy,
            category: cat_copy,
            visibility: v,
            version: agent.version,
        });
    }

    public entry fun update_persona(
        agent: &mut AgentNFT,
        persona: String,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let _ = ctx;
        agent.persona = persona;
        bump(agent, clock::timestamp_ms(clock));
        event::emit(PersonaUpdated {
            agent_id: object::id(agent),
            version: agent.version,
        });
    }

    public entry fun set_index_blob(
        agent: &mut AgentNFT,
        blob_id: String,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let _ = ctx;
        agent.index_blob = option::some(blob_id);
        bump(agent, clock::timestamp_ms(clock));

        let blob_copy = *option::borrow(&agent.index_blob);
        event::emit(IndexUpdated {
            agent_id: object::id(agent),
            index_blob: blob_copy,
            version: agent.version,
        });
    }

    /// Owner-only "I'm alive" check-in. Resets the dormancy timer
    /// without otherwise mutating the agent.
    public entry fun ping(
        agent: &mut AgentNFT,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let _ = ctx;
        let now = clock::timestamp_ms(clock);
        bump(agent, now);
        event::emit(AgentPinged {
            agent_id: object::id(agent),
            pinged_at_ms: now,
        });
    }

    public entry fun add_heir(
        agent: &mut AgentNFT,
        heir: address,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let _ = ctx;
        assert!(
            vector::length(&agent.heirs) < MAX_HEIRS,
            ETooManyHeirs,
        );
        assert!(!contains_addr(&agent.heirs, heir), EHeirAlreadyAdded);
        vector::push_back(&mut agent.heirs, heir);
        bump(agent, clock::timestamp_ms(clock));
        event::emit(HeirAdded {
            agent_id: object::id(agent),
            heir,
        });
    }

    public entry fun remove_heir(
        agent: &mut AgentNFT,
        heir: address,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let _ = ctx;
        let (found, idx) = find_addr(&agent.heirs, heir);
        assert!(found, EHeirNotFound);
        vector::remove(&mut agent.heirs, idx);
        bump(agent, clock::timestamp_ms(clock));
        event::emit(HeirRemoved {
            agent_id: object::id(agent),
            heir,
        });
    }

    public entry fun set_dormancy_threshold(
        agent: &mut AgentNFT,
        threshold_ms: u64,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        let _ = ctx;
        assert!(
            threshold_ms >= MIN_DORMANCY_MS &&
                threshold_ms <= MAX_DORMANCY_MS,
            EInvalidDormancy,
        );
        agent.dormancy_threshold_ms = threshold_ms;
        bump(agent, clock::timestamp_ms(clock));
        event::emit(DormancyChanged {
            agent_id: object::id(agent),
            threshold_ms,
        });
    }

    // ---- Internals -----------------------------------------------------

    fun bump(agent: &mut AgentNFT, now: u64) {
        agent.updated_at_ms = now;
        agent.version = agent.version + 1;
    }

    fun contains_addr(v: &vector<address>, target: address): bool {
        let n = vector::length(v);
        let mut i = 0;
        while (i < n) {
            if (*vector::borrow(v, i) == target) return true;
            i = i + 1;
        };
        false
    }

    fun find_addr(v: &vector<address>, target: address): (bool, u64) {
        let n = vector::length(v);
        let mut i = 0;
        while (i < n) {
            if (*vector::borrow(v, i) == target) return (true, i);
            i = i + 1;
        };
        (false, 0)
    }

    // ---- Read accessors -----------------------------------------------

    public fun name(a: &AgentNFT): &String { &a.name }
    public fun persona(a: &AgentNFT): &String { &a.persona }
    public fun avatar(a: &AgentNFT): &String { &a.avatar }
    public fun memory_count(a: &AgentNFT): u64 { vector::length(&a.memory_refs) }
    public fun version(a: &AgentNFT): u64 { a.version }
    public fun creator(a: &AgentNFT): address { a.creator }
    public fun heirs(a: &AgentNFT): &vector<address> { &a.heirs }
    public fun heir_count(a: &AgentNFT): u64 { vector::length(&a.heirs) }
    public fun dormancy_threshold_ms(a: &AgentNFT): u64 { a.dormancy_threshold_ms }
    public fun updated_at_ms(a: &AgentNFT): u64 { a.updated_at_ms }

    /// Convenience for off-chain readers that haven't pulled the entire
    /// object yet. They should still verify locally with current Clock.
    public fun is_dormant_at(a: &AgentNFT, now_ms: u64): bool {
        now_ms > a.updated_at_ms + a.dormancy_threshold_ms
    }
}
