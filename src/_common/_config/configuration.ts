import BigNumber from 'bignumber.js';

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
        },

        bitcoin : {
            host : process.env.NETWORK_BITCOIN_HOST,
            port: parseInt(process.env.NETWORK_BITCOIN_PORT),
            username : process.env.NETWORK_BITCOIN_USERNAME,
            password : process.env.NETWORK_BITCOIN_PASSWORD,
            starterBlockNumber : new BigNumber(process.env.NETWORK_BITCOIN_STARTER_BLOCK_NUMBER || 0),
            blockGap : new BigNumber(process.env.NETWORK_BITCOIN_LISTENER_BLOCK_GAP || 0),
        }

    }
});