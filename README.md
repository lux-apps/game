# game

[![Follow Lux](https://img.shields.io/twitter/follow/luxdefi?style=plastic&logo=twitter)](https://twitter.com/luxdefi)
[![Lux Forum](https://img.shields.io/badge/Lux%20Forum%20-discuss-blue?style=plastic&logo=discourse)](https://forum.lux.network/)

"Infinite Game" is a novel Web3/Solidity-based ARG, inspired by the likes of
OverTheWire and built upon the Ethereum Virtual Machine. Each level of the game
is meant to be 'hacked', offering an interactive, immersive experience for both
learning DeFi and Lux as well as preserving a catalog of historical hacks.
Unlike traditional games, Infinite Game features an unlimited number of levels
and doesn’t require sequential progression. This game is designed to enhance
network adoption and provide liquidity rewards for Lux early adopters, creating
an engaging alternate reality experience blended with real-world cryptocurrency
challenges.

The game acts both as a tool for those interested in learning ethereum, and as a way to catalogue historical hacks as levels. There can be an infinite number of levels and the game does not require to be played in any particular order.

## Play

[game.lux.network](https://game.lux.network), on Lux Testnet.

## Install and Build

There are three components to Lux that are needed to run/deploy in order to work with it locally:

- Test Network - A local chain: anvil, from [Foundry](https://getfoundry.sh/)
- Contract Deployment - In order to work with the contracts, they must be deployed to the local chain
- The Client/Frontend - A React app served by Vite, on localhost:5173

In order to install, build, and run Lux locally, follow these instructions:

0. Be sure to use a compatible Node version. If you use `nvm` you can run `nvm use` at the root level to be sure to select a compatible version. Install [Foundry](https://getfoundry.sh/) for `forge` and `anvil`.

1. Clone the repo and install dependencies:

    ```bash
    git clone --recurse-submodules git@github.com:lux-apps/game.git
    yarn install
    ```

2. Start a local chain (chain id 1337)

    ```bash
    yarn network
    ```

3. Import one of the private keys anvil prints into your wallet, on the network `http://127.0.0.1:8545`, chain id 1337.
4. Compile contracts

    ```bash
    yarn compile:contracts
    ```

5. Deploy contracts from anvil's first account. This writes `client/src/gamedata/deploy.local.json`.

    ```bash
    yarn deploy:contracts --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    ```

6. Start Game locally

    ```bash
    yarn start:game
    ```

The game plays on whichever network the wallet is connected to.

### Running against Lux Testnet

The same as using the local network but steps 2, 3 and 5 are not necessary: point the wallet at Lux Testnet (chain 96368, `https://api.lux-test.network/v1/chain/C/rpc`).

### Running tests

```bash
yarn test    # forge tests and the client's vitest suite
```

### Building

```bash
yarn build:game
```

### Deploying

`yarn deploy:contracts` runs `contracts/script/Deploy.s.sol`, which deploys every contract and level and writes their addresses to `client/src/gamedata/deploy.<network>.json`. The network is `local` on chain 1337 and otherwise comes from `NETWORK`:

```bash
cast wallet import lux-deployer --interactive   # once: the key goes into foundry's encrypted keystore
NETWORK=lux-testnet RPC_URL=https://api.lux-test.network/v1/chain/C/rpc \
  yarn deploy:contracts --account lux-deployer --sender <deployer address>
```

To replace a single deployed level, keeping its statistics, see [supersede_level.md](client/scripts/docs/supersede_level.md).

## Contributing

Contributions and corrections are always welcome!

Please follow the [Contributor's Guide](./CONTRIBUTING.md) if you would like to help out.
