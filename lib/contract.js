// Centralized ABI and contract configuration
import { SHOW_CONTRACT_ABI } from '../abi/ShowContract';
import { PREDICTION_MARKET_ABI } from '../abi/PredictionMarket';

export { SHOW_CONTRACT_ABI, PREDICTION_MARKET_ABI };
export const SHOW_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x458E0c9439F5d509f16D1DB834B4F37E9f7fFd2a';
export const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_PREDICTION_MARKET_ADDRESS || '0x4dc2F54CdbA42Feb605EC7B46FBA40AEff4893Ac';
