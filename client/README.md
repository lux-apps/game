# client

The game's web client: React, Vite and viem.

```bash
yarn dev      # dev server
yarn build    # production build in build/
```

ABIs and level sources are read from `../contracts` (run `forge build`
first); deployed addresses from `src/gamedata/deploy.<network>.json`.
Environment comes from the repository root `.env` (see `.env-sample`).
