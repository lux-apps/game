import { getLevelKey } from "./contractutil";
import { getDeployData } from "./deploycontract";
import gamedata from "../gamedata/gamedata.json";

const { levels } = gamedata;

export const getLevelDetailsByAddress = (levelAddress, chainId) => {
    // based on the deployId fetch the level name and difficulty
    const addressToId = Object.fromEntries(
      Object.entries(getDeployData(chainId)).map((a) => a.reverse())
    );
    const levelId = addressToId[levelAddress];
    const currentLevel = levels[levelId];
    // include the difficulty circles to give more context
    const difficultyCircles = drawDifficultyCircle(currentLevel?.difficulty)
    return {...currentLevel, difficultyCircles};
};

export const drawDifficultyCircle = (levelDifficulty) => {
    //Put as many ● as difficulty/2 (scaled from 10 to 5) and ○ as the rest up to 5
    var numberOfFullCircles = Math.ceil(levelDifficulty / 2);
    var numberOfEmptyCircles = 5 - numberOfFullCircles;
    var emptyCircle = "○";
    var fullCircle = "●";
    var difficulty = "";
    for (var j = 0; j < numberOfFullCircles; j++) {
      difficulty += fullCircle;
    }
  
    for (var k = 0; k < numberOfEmptyCircles; k++) {
      difficulty += emptyCircle;
    }

    return difficulty;
};

const getlevelsdata = (props, source) => {
    var levelData = [];
    let linkStyle = {};
    let levelComplete;
    let selectedIndex;

    for (var i = 0; i < levels.length; i++) {
        var difficulty = drawDifficultyCircle(levels[i].difficulty);

        if (props?.activeLevel) {
            const key = getLevelKey(props.params?.address);
            if (props.activeLevel[key] === levels[i][key]) {
                linkStyle.textDecoration = 'underline'
                selectedIndex = i;
            }
        }

        // Level completed
        levelComplete = props.player?.completedLevels[levels[i].deployedAddress] > 0

        // A level without art shows the default tile (see levelImageFallback).
        var object = {
            name: levels[i].name,
            src: source !== 'mosaic' ?
                `../../imgs/BigLevel${levels[i].deployId}.svg` :
                `../../imgs/Level${levels[i].deployId}.svg`,
            fallback: source !== 'mosaic' ?
                `../../imgs/BigDefault.svg` :
                `../../imgs/Default.svg`,
            difficulty: difficulty,
            deployedAddress: levels[i].deployedAddress,
            completed: levelComplete,
            id: levels[i].deployId,
            creationDate: levels[i].created
        }

        levelData.push(object);
    }

    return [levelData, levelData[selectedIndex]];
}

// onError handler for level tiles: swaps in the default image once.
export const levelImageFallback = (fallback) => (event) => {
    const image = event.currentTarget;
    if (image.dataset.fallback) return;
    image.dataset.fallback = "true";
    image.src = fallback;
};

export default getlevelsdata
