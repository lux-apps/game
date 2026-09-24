# game

**Org:** luxfi · **Ecosystem:** lux · **Origin:** https://github.com/luxfi/game.git

Ethernaut-style "hack the level" CTF. 30 levels (`client/src/gamedata/gamedata.json`),
each a `<X>Factory.sol` + `<X>.sol` instance. Registry contract is **Lux** (`Lux.sol`);
players create an instance through it, exploit it, and submit it back.

## Contracts — Foundry (contracts/)

Solidity ported from hardhat/truffle to Foundry on a single toolchain.

- `forge` at `~/.foundry/bin` (add to PATH). Build heavy on this box with `nice -n19 ionice -c3`.
- One compiler: **solc 0.8.37**, `evm_version = cancun`, optimizer runs 1000 (`foundry.toml`).
- **OpenZeppelin v5.7.0** (+ upgradeable), forge-std — git submodules in `contracts/lib`.
  Remappings in `contracts/remappings.txt`.
- Layout: sources `contracts/src`, tests `contracts/test`, scripts `contracts/script`.
  Artifacts `contracts/out` (gitignored).

```
cd contracts
forge build
forge test            # 54 tests
forge script script/Deploy.s.sol --broadcast --rpc-url <url> --private-key <key>
```

Root `package.json`: `compile:contracts`/`test`/`network` → forge/anvil.

### Porting decisions (do not undo)
- `Game.sol`→`Lux.sol` (`contract Lux`): the tests, deploy data and client all say Lux.
- Four versioned Level bases collapsed into one `levels/base/Level.sol` on v5
  `Ownable(msg.sender)`; `Ownable-05` deleted.
- The 16 pre-0.8 files are on 0.8.37 and stay exploitable. Wrap-around bugs are
  expressed with `unchecked` around exactly the vulnerable math — **Token**
  (balance underflow) and **Reentrance** (post-call debit). **AlienCodex**
  underflows its array length in assembly (>=0.6 forbids assigning `.length`),
  keeping every storage slot writable. **Fallout** keeps its misnamed `Fal1out`.
  The bug is the level; do not "fix" one.
- Proxy stack is v5-native: `ProxyStats` extends `TransparentUpgradeableProxy`
  (which deploys its own `ProxyAdmin`); `ProxyAdmin.sol` is a concrete alias of
  the v5 one so the artifact path survives. The deploy reads the ProxyAdmin from
  the proxy's ERC1967 admin slot.

### Motorbike
Completion is "the player seized the engine": the factory validates
`Engine(engine).upgrader() != address(0)` for the instance's engine. The old
check ("engine has no code") needed `selfdestruct` to delete code across
transactions, which EIP-6780 (the Cancun baseline) forbids.

### Leaderboard
Read from the chain, no service: `getLogs` over the Lux contract's
`LevelCompletedLog` (`containers/Leaderboard.jsx`), ranked by distinct levels
completed, tie to whoever got there first (`utils/leaderboard.js`, tested).

## Deployment
`script/Deploy.s.sol` deploys Lux + Statistics impl + ProxyStats, registers every
factory in deployId order, and writes `client/src/gamedata/deploy.<network>.json`
(keys `0`..`29` + `lux`/`implementation`/`proxyAdmin`/`proxyStats`). Network =
`NETWORK` env, or `local` for chain 1337. `script/Upgrade.s.sol` replaces
`upgrade_proxy.mjs`. Replacing one level while keeping its statistics is
`yarn supersede:level` (`client/scripts/supersede_level.mjs`, viem, driving
`StatisticsLevelSuperseder`; resumable; docs in `client/scripts/docs/`).

## Client — Vite + React 19 + viem (client/)

```
yarn network                                   # anvil --chain-id 1337
yarn compile:contracts && yarn deploy:contracts --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
yarn start:game                                # vite, :5173
yarn test                                      # forge + vitest
```

- Wallet = `window.ethereum` behind viem `custom` transport (`utils/ethutil.js`);
  network follows the wallet's chain. Networks: LOCAL (1337) and SEPOLIA only.
  A network is "predeployed" iff `gamedata/deploy.<network>.json` exists.
- **The console API is part of the game** (level texts tell players what to
  type). Globals: `player`, `lux`, `contract`, `instance`, `level`, `version`,
  `help()`, `getBalance`, `getBlockNumber`, `getNetworkId`, `getStorageAt`,
  `sendTransaction`, `toWei`, `fromWei`, `viem` (lazy), `deployAllContracts`,
  `localdeploy`, `transferOwnerShip`, `loadContracts`. `web3` is gone.
  `contractAt(abi, address)` builds `lux`/`contract`: view/pure → read, else a
  tx from `player` resolving to the receipt; trailing `{ value, from, gas }`;
  overloads by arity/type or `methods["fn(uint256)"]`. Pinned by
  `utils/ethutil.test.js`.
- Every write carries 1.5x the estimate unless `gas` is given: exact estimates
  ran `createLevelInstance` out of gas inside Statistics.
- `<File>.sol?artifact` (plugin in `vite.config.js`) imports forge's
  `contracts/out/<File>.sol/<File>.json` as `{ abi, bytecode }`; level artifacts
  and sources are globbed from `contracts/src/levels`. Run `forge build` first.
- Level texts: `gamedata/<lang>/descriptions/levels/*.md` (10 languages) and
  `gamedata/<lang>/strings.json`; loaded lazily per level.
