import LeaderTile from "./LeaderTile";

function LeaderList({ players }) {
    return (
        <div>
            {players.map((leader) => <LeaderTile key={leader.player} leader={leader} />)}
        </div>
    )
}

export default LeaderList;
