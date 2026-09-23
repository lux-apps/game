import "../styles/leaderboard.css";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getAbiItem } from "viem";
import { abi as luxAbi } from "../../../contracts/src/Lux.sol?artifact";
import LeaderList from "../components/leaderboard/LeaderList";
import Headers from "../components/leaderboard/Headers";
import Search from "../components/leaderboard/Search";
import Footer from "../components/common/Footer";
import { getLogs } from "../utils/ethutil";
import { getDeployData } from "../utils/deploycontract";
import { rank } from "../utils/leaderboard";

const playersPerPage = 20;
const completed = getAbiItem({ abi: luxAbi, name: "LevelCompletedLog" });

// The leaderboard is read from the chain the wallet is on: every completion
// the Lux contract there has logged.
function Leaderboard() {
    const networkId = useSelector((state) => state.network.networkId);
    const [players, setPlayers] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(0);

    useEffect(() => {
        const lux = networkId && getDeployData(networkId)?.lux;
        setPlayers([]);
        if (!lux) return;
        let current = true;
        getLogs({ address: lux, event: completed, fromBlock: "earliest" })
            .then((logs) => current && setPlayers(rank(logs)))
            .catch((err) => console.error("Failed to read the leaderboard", err));
        return () => { current = false; };
    }, [networkId]);

    const found = keyword
        ? players.filter((p) => p.player.toLowerCase().includes(keyword.toLowerCase()))
        : players;
    const pageCount = Math.ceil(found.length / playersPerPage);

    const search = (value) => {
        setKeyword(value);
        setPage(0);
    };

    return (
        <main className="boxes">
            <div className='leaderboard-body'>
                <div className="leaderboard-heading">
                    <div className="leaderboard-title">Leaderboard</div>
                    <Search keyword={keyword} onKeywordChange={search} />
                </div>
                <Headers />
                <div className='leaderboard-list-container'>
                    <LeaderList players={found.slice(page * playersPerPage, (page + 1) * playersPerPage)} />
                </div>
                <div className='leaderboard-outer-container'>
                    <Pager page={page} pages={pageCount} onPage={setPage} />
                </div>
            </div>
            <Footer />
        </main>
    )
}

// Previous, up to five numbered pages around the current one, and next.
function Pager({ page, pages, onPage }) {
    if (pages < 2) return null;
    const first = Math.max(0, Math.min(page - 2, pages - 5));
    const shown = Array.from({ length: Math.min(5, pages) }, (_, i) => first + i);
    const go = (to) => () => to >= 0 && to < pages && onPage(to);
    return (
        <ul className="leaderboard-pagination-container">
            <li><a className="leaderboard-button-link" onClick={go(page - 1)}><i className="fa-sharp fa-solid fa-arrow-left"></i></a></li>
            {shown.map((n) => (
                <li key={n}>
                    <a
                        className={n === page ? "leaderboard-pagination-page-item leaderboard-pagination-selected-page-item" : "leaderboard-pagination-page-item"}
                        onClick={go(n)}
                    >
                        {n + 1}
                    </a>
                </li>
            ))}
            <li><a className="leaderboard-button-link" onClick={go(page + 1)}><i className="fa-sharp fa-solid fa-arrow-right"></i></a></li>
        </ul>
    )
}

export default Leaderboard;
