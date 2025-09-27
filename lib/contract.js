// Centralized ABI and contract configuration
import { SHOW_CONTRACT_ABI } from '../abi/ShowContract.js';
import { PREDICTION_MARKET_ABI } from '../abi/PredictionMarket.js';

export { SHOW_CONTRACT_ABI, PREDICTION_MARKET_ABI };
export const SHOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x759aB3Ba417Da08eA211fC0312902786D889Bc25';
export const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '0x0f2c6AE75Ef0834ca6C1694b5105e2f6bAEd9ff3';
