import { ALIAS_PATH } from "../../constants";

const getAliases = async () => { 
    try { 
        const response = await fetch(ALIAS_PATH)
        if (!response.ok) throw new Error(`${ALIAS_PATH}: ${response.status}`)
        window.aliases = await response.json()
    } catch (err) { 
        console.log(err)
    }
}

export const checkIfAliasIsPresent = (alias) => {
    try {
        const aliases = Object.values(window.aliases)
        return aliases.includes(alias)
    } catch (err) { 
        console.log(err)
    }
}

getAliases()