// Centralized ABI and contract configuration
import { SHOW_CONTRACT_ABI } from '../abi/ShowContract.js';
import { PREDICTION_MARKET_ABI } from '../abi/PredictionMarket.js';

export { SHOW_CONTRACT_ABI, PREDICTION_MARKET_ABI };
export const SHOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xbD4fc08ca20bf8B73Ae83955D5dB2CB97C8A9032';
export const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '0x0f2c6AE75Ef0834ca6C1694b5105e2f6bAEd9ff3';
