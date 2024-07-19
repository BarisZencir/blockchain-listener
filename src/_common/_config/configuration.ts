import BigNumber from 'bignumber.js';
import { BlockchainName } from '../enums/blockchain.name.enums';


const generateTokenMap = (tokenGroup : string) : Map<string, string> => {
    const map = new Map<string, string>();
    const tokens = tokenGroup.split(' ');

    for (let i = 0; i < tokens.length; i += 2) {
        const key = tokens[i];
        const value = tokens[i + 1];
        map.set(key, value);
    }

    return map;
}

// const generateTokenListenerGroups = (network : string) : Array<Map<string, number>> => {
//     let headerKey = "NETWORK_" + network + "_TOKEN_GROUP_"
//     genetrateTokenMap bunu kullan icerde do while ile yaz. i arttırarak NETWORK_ETHEREUM_TOKEN_GROUP_1 gibi .env yi process.env. den var mi diye kontrol et.
// }


const generateTokenGroups = (network: string): Array<Map<string, string>> => {
    let headerKey = `NETWORK_${network}_TOKEN_GROUP_`;
    let i = 0;
    const list: Array<Map<string, string>> = [];

    do {
        const envKey = `${headerKey}${i}`;
        const tokenGroup = process.env[envKey];

        if (tokenGroup) {
            const tokenMap = generateTokenMap(tokenGroup);
            list.push(tokenMap);
        } else {
            break;
        }
        
        i++;
    } while (true);

    return list;
};


export default () => ({
    config: {
        test: process.env.CONFIG_TEST,
    },
    wallet : {
        numberOfAddresses : parseInt(process.env.HOT_WALLET_NUMBER_OF_ADDRESSES)
    },
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT, 10) || 5432
    },
    network: {
        ethereum : {
            ws: process.env.NETWORK_ETHEREUM_WS,
            chainId: parseInt(process.env.NETWORK_ETHEREUM_CHAIN_ID),
            networkId: parseInt(process.env.NETWORK_ETHEREUM_NETWORK_ID),
            starterBlockNumber : new BigNumber(process.env.NETWORK_ETHEREUM_STARTER_BLOCK_NUMBER || 0),
            blockGap : new BigNumber(process.env.NETWORK_ETHEREUM_LISTENER_BLOCK_GAP || 0),
            tokenGroups : generateTokenGroups(BlockchainName.ETHEREUM)
        },

        bitcoin : {
            host : process.env.NETWORK_BITCOIN_HOST,
            port: parseInt(process.env.NETWORK_BITCOIN_PORT),
            username : process.env.NETWORK_BITCOIN_USERNAME,
            password : process.env.NETWORK_BITCOIN_PASSWORD,
            starterBlockNumber : new BigNumber(process.env.NETWORK_BITCOIN_STARTER_BLOCK_NUMBER || 0),
            blockGap : new BigNumber(process.env.NETWORK_BITCOIN_LISTENER_BLOCK_GAP || 0),
            satoshiFee : new BigNumber(process.env.NETWORK_BITCOIN_SATOSHI_FEE || 0)
        }

    }
});