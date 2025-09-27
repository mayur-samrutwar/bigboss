// Centralized ABI and contract configuration
import { SHOW_CONTRACT_ABI } from '../abi/ShowContract';
import { PREDICTION_MARKET_ABI } from '../abi/PredictionMarket';

export { SHOW_CONTRACT_ABI, PREDICTION_MARKET_ABI };
export const SHOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x431B6f13ccaCF148B2532e2B0B2Dff3d4a17ef83';
export const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '0x1235bC5C012b29112B6cE1F35A368BB652F0e6d8';
