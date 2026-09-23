# OZ-Lux contract level replacement tool

## **Description**

Change the contract code directly in the repo will change the front-end contract but not the on-chain bytecode of that level. Therefore, while players try to attack a level instance, the front-end will show a different contract than what they actually have to attack, they may differ with function names for example (i.e. selectors).

[`supersede_level.mjs`](https://github.com/luxdefi/game/blob/master/client/scripts/supersede_level.mjs) script implements a tool to supersede contract deployed on-chain when it will be required (when vulnerable code displayed on the front-end will not exactly match the deployed contracts).

The tool performs the substitution by following these steps:
- Deploys new level contract.
- Registers level in Lux.sol
- Upgrades Statistics.sol to StatisticsLevelSuperseder.sol, a implementation that contains the logic to change statistics storage:
    - levelFirstInstanceCreationTime - dump from old level address to new one.
    - levelFirstCompletionTime - dump from old level address to new one.
    - playerStats - dump from old level address to new one.
    - levelStats - dump from old level address to new one.
    - levelExists - set false old level address.
    - levels - fix supersede old level with new one and wipe extra entry.
- Dumps the data 
- Downgrades the Statistics.sol to original one.

All this process is required in order to avoid to the users to resolve both versions and score double, maintain the statistics of a specific level, and maintain the consistency of the leaderboard scores.

## **Usage**

```bash
NETWORK=lux-testnet RPC_URL=https://api.lux-test.network/v1/chain/C/rpc PRIV_KEY=<operator key> yarn supersede:level
```

`NETWORK` picks `client/src/gamedata/deploy.<network>.json` (`local` by default) and `RPC_URL` the node (`http://127.0.0.1:8545` by default). The account behind `PRIV_KEY` signs every transaction and becomes the operator that runs the storage dump, so it must own Lux and the ProxyAdmin. Without `PRIV_KEY`, the node signs for `FROM`, or for its first unlocked account when `FROM` is unset, which is what anvil offers. The tool reads ABIs and bytecode from `contracts/out`, so run `forge build` first.

The tool asks for the deployId and a confirmation; answers can also be piped in (`printf '8\ny\n' | yarn supersede:level`). If a replacement was interrupted, running it again resumes from the dump stage stored on chain.

Lux is halted during the operation: any call to `createLevelInstance(Level _level)` or `submitLevelInstance(address payable _instance)` reverts with `"Contract locked due maintenance operations"`.

At the end the proxy returns to the Statistics implementation named by `implementation` in the deploy data, and the deploy data records the substitution under `supersededAddresses`. Dump transactions carry a fixed gas limit (`DUMP_GAS`) because the dump functions work until `gasleft()` runs low.

### **Test in a local fork**

```bash
anvil --fork-url <rpc url> --auto-impersonate
NETWORK=lux-testnet FROM=<Lux owner> yarn supersede:level
```

With `--auto-impersonate` anvil signs for any address, so `FROM` can be the real owner of Lux and the ProxyAdmin.
