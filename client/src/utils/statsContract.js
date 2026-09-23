import { formatEther } from 'viem';
import { contractAt } from './ethutil';
import { getDeployData } from './deploycontract';
import { getLevelDetailsByAddress } from './getlevelsdata';
import { abi as statisticsAbi } from '../../../contracts/out/Statistics.sol/Statistics.json';

export const getLevelsSolvedByPlayer = async (playerAddress, networkId) => {
    if (!(playerAddress || networkId)) {
        return;
    }

    const levelAddresses = getLevelAddressesInNetwork(networkId)
    const statsContract = getStatsContract(networkId)
    const listOfLevelsSolved = await getListOfLevelsSolvedByPlayer(statsContract, levelAddresses, playerAddress, 5)
    const levelDetails = listOfLevelsSolved.map(oneLevel => {
        return getLevelDetailsByAddress(oneLevel, networkId);
    });

    return levelDetails
}

export const getPercentageOfLevelsSolvedByPlayer = async (playerAddress, networkId) => {
    if (!(playerAddress || networkId)) {
        return
    }
    const statsContract = getStatsContract(networkId)
    return await getPercentageOfLevelsSolved(statsContract, playerAddress)
}

export const getTotalPlayers = async (networkId) => {
    if (!networkId) {
        return
    }
    const statsContract = getStatsContract(networkId)
    return await getTotalNumberOfPlayers(statsContract)
}

export const getTotalFailures = async (networkId) => {
    if (!networkId) {
        return
    }
    const statsContract = getStatsContract(networkId)
    return await getFailedSubmissions(statsContract)
}

export const getTotalCompleted = async (networkId) => {
    if (!networkId) {
        return
    }
    const statsContract = getStatsContract(networkId)
    return await getCompletedLevels(statsContract)
}

export const getTotalCreated = async (networkId) => {
    if (!networkId) {
        return
    }
    const statsContract = getStatsContract(networkId)
    return await getLevelsCreated(statsContract)
}

export const checkIfPlayerExist = async (playerAddress, networkId) => {
    if (!(playerAddress || networkId)) {
        return
    }
    const statsContract = getStatsContract(networkId)
    return await statsContract.doesPlayerExist(playerAddress)
}

const getPercentageOfLevelsSolved = async (statsContract, playerAddress) => {
    const response = await statsContract.getPercentageOfLevelsCompleted(playerAddress)
    const roundedPercentage = (formatEther(response) * 100).toFixed(2)
    return roundedPercentage
}

const getTotalNumberOfPlayers = async (statsContract) => {
    const response = await statsContract.getTotalNoOfPlayers()
    return response
}

const getFailedSubmissions = async (statsContract) => {
    const response = await statsContract.getTotalNoOfFailedSubmissions()
    return response
}

const getCompletedLevels = async (statsContract) => {
    const response = await statsContract.getTotalNoOfLevelInstancesCompleted()
    return response
}

const getLevelsCreated = async (statsContract) => {
    const response = await statsContract.getTotalNoOfLevelInstancesCreated()
    return response
}


const getListOfLevelsSolvedByPlayer = async (statsContract, levelAddresses, playerAddress, noOfQueriesAtAtime) => {
    const isLevelSolvedRequestsList = getIsLevelSolvedRequestsList(statsContract, levelAddresses, playerAddress)
    const isLevelSolvedRequestsListChunked = chunk(isLevelSolvedRequestsList, noOfQueriesAtAtime)
    let isLevelSolvedList = []
    for (let i = 0; i < isLevelSolvedRequestsListChunked.length; i++) {
        const result = await Promise.all(isLevelSolvedRequestsListChunked[i])
        isLevelSolvedList.push(...result)
    }
    return getListOfSolvedLevels(isLevelSolvedList)
}

const getListOfSolvedLevels = (isLevelSolvedList) => {
    const listOfSolvedLevels = isLevelSolvedList
        .filter(item => item.isSolved)
        .map(item => item.levelAddress)
    return listOfSolvedLevels
}

const chunk = (list, chunkSize) => {
    let chunkedList = [...Array(Math.ceil(list.length / chunkSize))].map(_ => list.splice(0, chunkSize))
    return chunkedList
}

const getIsLevelSolvedRequestsList = (statsContract, levelAddresses, playerAddress) => {
    const levelNos = Object.keys(levelAddresses);
    const listOfIsLevelSolvedRequests = []
    for (let levelNo of levelNos) {
        listOfIsLevelSolvedRequests.push(isLevelSolvedByPlayer(statsContract, levelAddresses[levelNo], playerAddress))
    }
    return listOfIsLevelSolvedRequests;
}

const isLevelSolvedByPlayer = async (statsContract, levelAddress, playerAddress) => {
    const isSolved = await statsContract.isLevelCompleted(playerAddress, levelAddress)
    return {
        levelAddress,
        isSolved,
    };
}

const getLevelAddressesInNetwork = (networkId) => {
    const deployedNetworkData = getDeployData(networkId);
    const keys = Object.keys(deployedNetworkData);
    const levelAddresses = {}
    for (let key of keys) {
        if (!isNaN(Number(key))) {
            levelAddresses[key] = deployedNetworkData[key];
        }
    }
    return levelAddresses;
}

// Statistics is read through its proxy.
const getStatsContract = (networkId) =>
    contractAt(statisticsAbi, getDeployData(networkId).proxyStats)
