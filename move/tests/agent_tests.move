// Unit tests for the agent module (Living Will edition).
//
// Run with:  sui move test
//
// Coverage:
//   1. mint_agent transfers an AgentNFT with the right defaults
//   2. add_memory persists visibility + bumps version
//   3. ping bumps updated_at_ms
//   4. add_heir + remove_heir round-trip
//   5. duplicate add_heir aborts (EHeirAlreadyAdded)
//   6. remove non-existent heir aborts (EHeirNotFound)
//   7. set_dormancy_threshold validates bounds
//   8. is_dormant_at reflects updated_at_ms + threshold

#[test_only]
module agent_vault::agent_tests {
    use std::string;
    use sui::clock;
    use sui::test_scenario as ts;
    use agent_vault::agent::{Self, AgentNFT};

    const ALICE: address = @0xA11CE;
    const BOB: address = @0xB0B;
    const CAROL: address = @0xCA801;

    // 60 seconds — minimum allowed dormancy threshold.
    const MIN_DORMANCY: u64 = 60_000;

    fun mint(scenario: &mut ts::Scenario) {
        ts::next_tx(scenario, ALICE);
        let clock = clock::create_for_testing(ts::ctx(scenario));
        agent::mint_agent(
            string::utf8(b"Aria"),
            string::utf8(b"You are a helpful research assistant."),
            string::utf8(b"\xF0\x9F\xA4\x96"), // 🤖
            MIN_DORMANCY,
            &clock,
            ts::ctx(scenario),
        );
        clock::destroy_for_testing(clock);
    }

    #[test]
    fun mint_creates_owned_agent_with_defaults() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let agent = ts::take_from_sender<AgentNFT>(&scenario);
        assert!(agent::memory_count(&agent) == 0, 100);
        assert!(agent::version(&agent) == 0, 101);
        assert!(agent::creator(&agent) == ALICE, 102);
        assert!(agent::heir_count(&agent) == 0, 103);
        assert!(agent::dormancy_threshold_ms(&agent) == MIN_DORMANCY, 104);
        ts::return_to_sender(&scenario, agent);

        ts::end(scenario);
    }

    #[test]
    fun add_memory_appends_with_visibility_and_bumps_version() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        agent::add_memory(
            &mut agent,
            string::utf8(b"blob_public"),
            string::utf8(b"fact"),
            1, // V_HEIR_VISIBLE
            &clock,
            ts::ctx(&mut scenario),
        );
        agent::add_memory(
            &mut agent,
            string::utf8(b"blob_private"),
            string::utf8(b"secret"),
            0, // V_PRIVATE
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
    fun ping_bumps_updated_at_and_version() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 5_000);

        agent::ping(&mut agent, &clock, ts::ctx(&mut scenario));

        assert!(agent::version(&agent) == 1, 300);
        assert!(agent::updated_at_ms(&agent) == 5_000, 301);

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, agent);
        ts::end(scenario);
    }

    #[test]
    fun add_and_remove_heir_round_trip() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        agent::add_heir(&mut agent, BOB, &clock, ts::ctx(&mut scenario));
        agent::add_heir(&mut agent, CAROL, &clock, ts::ctx(&mut scenario));
        assert!(agent::heir_count(&agent) == 2, 400);

        agent::remove_heir(&mut agent, BOB, &clock, ts::ctx(&mut scenario));
        assert!(agent::heir_count(&agent) == 1, 401);

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, agent);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 0, location = agent_vault::agent)]
    fun duplicate_heir_aborts() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        agent::add_heir(&mut agent, BOB, &clock, ts::ctx(&mut scenario));
        agent::add_heir(&mut agent, BOB, &clock, ts::ctx(&mut scenario)); // boom

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, agent);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 1, location = agent_vault::agent)]
    fun remove_unknown_heir_aborts() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        agent::remove_heir(&mut agent, BOB, &clock, ts::ctx(&mut scenario));

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, agent);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 4, location = agent_vault::agent)]
    fun dormancy_below_minimum_aborts() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));

        agent::set_dormancy_threshold(&mut agent, 100, &clock, ts::ctx(&mut scenario));

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, agent);
        ts::end(scenario);
    }

    #[test]
    fun is_dormant_at_reflects_threshold() {
        let mut scenario = ts::begin(ALICE);
        mint(&mut scenario);

        ts::next_tx(&mut scenario, ALICE);
        let mut agent = ts::take_from_sender<AgentNFT>(&scenario);
        let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));

        // Ping at t=1000 with threshold = MIN_DORMANCY (60_000ms).
        clock::set_for_testing(&mut clock, 1000);
        agent::ping(&mut agent, &clock, ts::ctx(&mut scenario));

        assert!(!agent::is_dormant_at(&agent, 30_000), 600);
        assert!(!agent::is_dormant_at(&agent, 61_000), 601); // 1000+60000 = 61000, not yet >
        assert!(agent::is_dormant_at(&agent, 61_001), 602);

        clock::destroy_for_testing(clock);
        ts::return_to_sender(&scenario, agent);
        ts::end(scenario);
    }
}
