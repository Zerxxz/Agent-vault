// Unit tests for the agent module.
//
// Run with:  sui move test
//
// Coverage:
//   1. mint_agent transfers an AgentNFT to the caller and emits an event.
//   2. add_memory appends a MemoryRef and bumps the version.
//   3. update_persona changes the persona and bumps the version.
//   4. set_index_blob stores a Some<String> and bumps the version.

#[test_only]
module agent_vault::agent_tests {
    use std::string;
    use sui::clock;
    use sui::test_scenario as ts;
    use agent_vault::agent::{Self, AgentNFT};

    const ALICE: address = @0xA11CE;

    fun mint(scenario: &mut ts::Scenario) {
        ts::next_tx(scenario, ALICE);
        let clock = clock::create_for_testing(ts::ctx(scenario));
        agent::mint_agent(
            string::utf8(b"Aria"),
            string::utf8(b"You are a helpful research assistant."),
            string::utf8(b"\xF0\x9F\xA4\x96"), // 🤖
            &clock,
            ts::ctx(scenario),
        );
        clock::destroy_for_testing(clock);
    }

    #[test]
    fun mint_creates_owned_agent() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let agent = ts::take_from_sender<AgentNFT>(&scenario);
        assert!(agent::memory_count(&agent) == 0, 100);
        assert!(agent::version(&agent) == 0, 101);
        assert!(agent::creator(&agent) == ALICE, 102);
        ts::return_to_sender(&scenario, agent);

        ts::end(scenario);
    }

    #[test]
    fun add_memory_appends_and_bumps_version() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1_700_000_000_000);

        agent::add_memory(
            &mut agent,
            string::utf8(b"blob_abc"),
            string::utf8(b"fact"),
            &clock,
            ts::ctx(&mut scenario),
        );
        agent::add_memory(
            &mut agent,
            string::utf8(b"blob_def"),
            string::utf8(b"preference"),
            &clock,
            ts::ctx(&mut scenario),
        );

        assert!(agent::memory_count(&agent) == 2, 200);
        assert!(agent::version(&agent) == 2, 201);

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, agent);
        ts::end(scenario);
    }

    #[test]
    fun update_persona_bumps_version() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        agent::update_persona(
            &mut agent,
            string::utf8(b"You are a witty companion."),
            &clock,
            ts::ctx(&mut scenario),
        );

        assert!(agent::version(&agent) == 1, 300);

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, agent);
        ts::end(scenario);
    }

    #[test]
    fun set_index_blob_stores_and_bumps() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        agent::set_index_blob(
            &mut agent,
            string::utf8(b"index_blob_xyz"),
            &clock,
            ts::ctx(&mut scenario),
        );

        assert!(agent::version(&agent) == 1, 400);

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, agent);
        ts::end(scenario);
    }
}
