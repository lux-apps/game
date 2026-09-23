import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store, history } from "./store";
import { syncHistoryWithStore } from "react-router-redux";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import * as ethutil from "./utils/ethutil";
import "bootstrap/dist/css/bootstrap.css";
import "./styles/app.css";
import * as actions from "../src/actions";
import * as constants from "../src/constants";
import "./utils/^^";
import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";
import App from "./containers/App";
import NotFound404 from "./components/not-found/NotFound404";
import Header from "./containers/Header";
import Leaderboard from "./containers/Leaderboard";

// For bundle splitting without lazy loading.
const nonlazy = (component) => lazy(() => component);

const Level = nonlazy(import("./containers/Level"));
const Help = nonlazy(import("./containers/Help"));
const Stats = nonlazy(import("./containers/Stats"));

Sentry.init({
  dsn: constants.SENTRY_DSN,
  debug: false,
  tunnel: "/errors",
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0,
  release: constants.VERSION,
});
// Levels load once the wallet has told us its chain; without a wallet the
// game is read only.
let ready = Promise.resolve();
if (window.ethereum) {
  ethutil.connect(window.ethereum);
  store.dispatch(actions.connectWallet());
  ready = ethutil.getNetworkId().then((id) => store.dispatch(actions.setNetworkId(id)));
}
ready.then(() => store.dispatch(actions.loadGamedata()));

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <Provider store={store}>
    <Router history={syncHistoryWithStore(history, store)}>
      <Suspense fallback={<div>Loading...</div>}>
        <Header></Header>
        <Routes>
          <Route path={constants.PATH_HELP} element={<Help />} />
          <Route path={constants.PATH_LEVEL} element={<Level />} />
          <Route path={constants.PATH_STATS} element={<Stats />} />
          <Route path={constants.PATH_LEADERBOARD} element={<Leaderboard />} />
          <Route exact path="/" element={<App />} />
          <Route path="*" element={<NotFound404 />} />
        </Routes>
      </Suspense>
    </Router>
  </Provider>
);

// Post-load actions.
window.addEventListener("load", async () => {
  if (!window.ethereum) return;
  let player;
  try {
    player = await ethutil.requestAccount();
  } catch (error) {
    console.error(error);
    console.error(`Refresh the page to approve/reject again`);
    return;
  }
  await ready;
  store.dispatch(actions.setPlayerAddress(player));
  store.dispatch(actions.loadLuxContract());
  window.ethereum.on?.("accountsChanged", ([account]) => {
    if (account && account.toLowerCase() !== store.getState().player.address?.toLowerCase())
      store.dispatch(actions.setPlayerAddress(account));
  });
  window.ethereum.on?.("chainChanged", (id) => {
    store.dispatch(actions.setNetworkId(Number(id)));
  });
});
