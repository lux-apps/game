import { useToast } from "../utils/Toast";
import Tooltip from "../utils/Tooltip";

function LeaderTile({ leader }) {
    const { rank, player, totalNumberOfLevelsCompleted } = leader;
    const { toast, Toast } = useToast()

    const handleClick = () => {
        navigator.clipboard.writeText(player);
        toast("Address copied")
    }

    return (
        <>
            {Toast}
            <div className='leaderboard-tile'>
                <div className="leaderboard-rank">{rank}</div>
                <div className="leaderboard-player">
                    <Tooltip content={player}>
                        <div onClick={handleClick}>{player.slice(0, 18)}...</div>
                    </Tooltip>
                </div>
                <div className="leaderboard-levels-solved">
                    {totalNumberOfLevelsCompleted}
                </div>
            </div>
        </>
    )
}

export default LeaderTile;
