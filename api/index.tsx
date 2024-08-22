import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { ethers } from 'ethers'
import { FarcasterNetwork } from '@farcaster/hub-nodejs'
import { ViemWalletEip712Signer } from '@farcaster/auth-kit'

const DEBUG = false; // Set to true to show debug info

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 630 },
  title: '$GOLDIES Token Tracker on Polygon',
})

const GOLDIES_TOKEN_ADDRESS = '0x3150E01c36ad3Af80bA16C1836eFCD967E96776e'
const POLYGON_RPC_URL = 'https://polygon-rpc.com'
const POLYGON_CHAIN_ID = 137

const ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

async function resolveFidToAddress(fid: number): Promise<string | null> {
  try {
    console.log(`Attempting to resolve FID: ${fid} to Ethereum address`);
    const network = FarcasterNetwork.MAINNET;
    
    // Use ViemWalletEip712Signer instead of getAuthClientForFid
    const signer = new ViemWalletEip712Signer();
    const result = await signer.getSignerByFid(fid);
    
    if (result.success) {
      const address = result.value.address;
      console.log(`Resolved address for FID ${fid}: ${address}`);
      return address;
    } else {
      console.log(`No verified address found for FID ${fid}`);
      return null;
    }
  } catch (error) {
    console.error('Error resolving FID to address:', error);
    return null;
  }
}

async function getGoldiesBalance(fid: number): Promise<string> {
  let errorMessage = '';
  try {
    console.log(`Attempting to fetch balance for FID: ${fid} on Polygon network`);
    
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL, POLYGON_CHAIN_ID);
    console.log('Polygon provider created');
    
    const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider);
    console.log('Contract instance created on Polygon');
    
    const address = await resolveFidToAddress(fid);
    if (!address) {
      return 'Error: Unable to resolve FID to Ethereum address';
    }
    console.log(`Resolved address: ${address}`);
    
    const balance = await contract.balanceOf(address);
    console.log(`Raw balance on Polygon: ${balance.toString()}`);
    
    const decimals = await contract.decimals();
    console.log(`Decimals: ${decimals}`);
    
    const formattedBalance = ethers.formatUnits(balance, decimals);
    console.log(`Formatted balance on Polygon: ${formattedBalance}`);
    
    return Number(formattedBalance).toFixed(2);
  } catch (error) {
    console.error('Error in getGoldiesBalance on Polygon:', error);
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('CALL_EXCEPTION')) {
        errorMessage = 'Contract call failed on Polygon. The balance may not be available for this address.';
      }
    } else {
      errorMessage = 'Unknown error on Polygon network';
    }
    return `Error on Polygon: ${errorMessage}`;
  } finally {
    console.log(`Balance fetch attempt completed on Polygon. Error: ${errorMessage}`);
  }
}

// The rest of your code remains the same
// ...

export const GET = handle(app);
export const POST = handle(app);