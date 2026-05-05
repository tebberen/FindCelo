import abi from './abi.json';

export const CONTRACT_ADDRESS = '0x0aB4561fff825C7C886fe22A66061De011e70bBd';
export const FIND_CELO_ABI = abi;

export const TABLE_TYPES = {
  BRONZE: 0,
  SILVER: 1,
  GOLD: 2,
};

export const TABLE_COSTS = {
  [TABLE_TYPES.BRONZE]: '1',
  [TABLE_TYPES.SILVER]: '5',
  [TABLE_TYPES.GOLD]: '10',
};
