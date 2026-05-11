import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ADDRESS_TO_FID_PATH = path.join(DATA_DIR, 'address_to_fid.json');
const FID_TO_TOKEN_PATH = path.join(DATA_DIR, 'fid_to_token.json');
const PROCESSED_TXS_PATH = path.join(DATA_DIR, 'processed_txs.json');

function readJson(filepath: string, defaultVal: any = {}) {
  if (!fs.existsSync(filepath)) return defaultVal;
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) {
    console.error(`Error reading ${filepath}:`, e);
    return defaultVal;
  }
}

function writeJson(filepath: string, data: any) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Error writing ${filepath}:`, e);
  }
}

export function saveAddressFidMapping(address: string, fid: number) {
  const data = readJson(ADDRESS_TO_FID_PATH);
  data[address.toLowerCase()] = fid;
  writeJson(ADDRESS_TO_FID_PATH, data);
}

export function getFidByAddress(address: string): number | undefined {
  const data = readJson(ADDRESS_TO_FID_PATH);
  return data[address.toLowerCase()];
}

export function saveFidTokenMapping(fid: number, token: string, url: string) {
  const data = readJson(FID_TO_TOKEN_PATH);
  data[fid.toString()] = { token, url };
  writeJson(FID_TO_TOKEN_PATH, data);
}

export function getTokenByFid(fid: number): { token: string; url: string } | undefined {
  const data = readJson(FID_TO_TOKEN_PATH);
  return data[fid.toString()];
}

export function markTxProcessed(txHash: string) {
  const data = readJson(PROCESSED_TXS_PATH, []);
  if (!data.includes(txHash.toLowerCase())) {
    data.push(txHash.toLowerCase());
    writeJson(PROCESSED_TXS_PATH, data);
  }
}

export function isTxProcessed(txHash: string): boolean {
  const data = readJson(PROCESSED_TXS_PATH, []);
  return data.includes(txHash.toLowerCase());
}
