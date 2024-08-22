import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { ethers } from 'ethers'

const DEBUG = true; // Set to false in production

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

async function getGoldiesBalance(address: string): Promise<string> {
  try {
    console.log(`Fetching balance for address: ${address} on Polygon network`);
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL, POLYGON_CHAIN_ID);
    const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider);
    
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    
    const formattedBalance = ethers.formatUnits(balance, decimals);
    console.log(`Formatted balance: ${formattedBalance}`);
    
    return Number(formattedBalance).toFixed(2);
  } catch (error) {
    console.error('Error in getGoldiesBalance:', error);
    return 'Error: Unable to fetch balance';
  }
}

function fidToAddress(fid: number): string {
  return ethers.getAddress(`0x${fid.toString(16).padStart(40, '0')}`)
}

app.frame('/check', async (c) => {
  const { frameData, verified } = c;
  const fid = frameData?.fid as number | undefined;
  
  let address: string | undefined;
  let verificationStatus = 'Unverified';

  if (verified && typeof verified === 'object') {
    const verifiedObj = verified as Record<string, unknown>;
    address = (verifiedObj.walletAddress as string) || 
              (verifiedObj.address as string) || 
              (verifiedObj.custody as string);
    verificationStatus = 'Verified';
  } else if (fid) {
    address = fidToAddress(fid);
    verificationStatus = 'Derived (Unverified)';
  }

  let balance = 'N/A';
  let balanceDisplay = '';

  if (address) {
    balance = await getGoldiesBalance(address);
    if (balance === '0.00') {
      balanceDisplay = "You don't have any $GOLDIES tokens on Polygon yet!";
    } else if (!balance.startsWith('Error')) {
      balanceDisplay = `${balance} $GOLDIES on Polygon`;
    } else {
      balanceDisplay = balance;
    }
  } else {
    balanceDisplay = 'No Ethereum address available. Please ensure your wallet is connected to Farcaster.';
  }

  const debugInfo = JSON.stringify({
    frameData,
    verified,
    fid,
    address,
    verificationStatus,
    balance,
    network: 'Polygon',
    chainId: POLYGON_CHAIN_ID
  }, null, 2);

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#FF8B19', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>Your $GOLDIES Balance on Polygon</h1>
        <p style={{ fontSize: '36px', textAlign: 'center' }}>{balanceDisplay}</p>
        <p style={{ fontSize: '24px', marginTop: '20px', textAlign: 'center' }}>Farcaster ID: {fid !== undefined ? fid : 'Not available'}</p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>Address: {address || 'Not available'}</p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>Status: {verificationStatus}</p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>Network: Polygon (Chain ID: {POLYGON_CHAIN_ID})</p>
        {DEBUG && (
          <p style={{ fontSize: '14px', marginTop: '20px', maxWidth: '100%', wordWrap: 'break-word', textAlign: 'left' }}>Debug Info: {debugInfo}</p>
        )}
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
      <Button.Link href="https://polygonscan.com/token/0x3150e01c36ad3af80ba16c1836efcd967e96776e">Polygonscan</Button.Link>,
      <Button action="/check">Refresh Balance</Button>
    ]
  });
});

export const GET = handle(app);
export const POST = handle(app);