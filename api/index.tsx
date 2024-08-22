import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { ethers } from 'ethers'

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 630 },
  title: 'GOLDIES Token Tracker',
})

const GOLDIES_TOKEN_ADDRESS = '0x3150E01c36ad3Af80bA16C1836eFCD967E96776e'
const POLYGON_RPC_URL = 'https://polygon-rpc.com'

const ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

function fidToAddress(fid: number): string {
  return ethers.getAddress(`0x${fid.toString(16).padStart(40, '0')}`)
}

async function getGoldiesBalance(address: string): Promise<string> {
  let errorMessage = '';
  try {
    console.log(`Attempting to fetch balance for address: ${address}`);
    
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    console.log('Provider created');
    
    const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider);
    console.log('Contract instance created');
    
    const balance = await contract.balanceOf(address);
    console.log(`Raw balance: ${balance.toString()}`);
    
    const decimals = await contract.decimals();
    console.log(`Decimals: ${decimals}`);
    
    const formattedBalance = ethers.formatUnits(balance, decimals);
    console.log(`Formatted balance: ${formattedBalance}`);
    
    return Number(formattedBalance).toFixed(2);
  } catch (error) {
    console.error('Error in getGoldiesBalance:', error);
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('CALL_EXCEPTION')) {
        errorMessage = 'Contract call failed. The balance may not be available for this address.';
      }
    } else {
      errorMessage = 'Unknown error';
    }
    return `Error: ${errorMessage}`;
  } finally {
    console.log(`Balance fetch attempt completed. Error: ${errorMessage}`);
  }
}

app.frame('/check', async (c) => {
  const { frameData, verified } = c
  const fid = frameData?.fid as number | undefined
  
  let address: string | undefined
  if (fid) {
    address = fidToAddress(fid)
  }

  let balance = 'N/A'
  if (address) {
    balance = await getGoldiesBalance(address)
  }

  let balanceDisplay = ''
  if (balance === '0.00') {
    balanceDisplay = "You don't have any GOLDIES tokens yet!"
  } else if (!balance.startsWith('Error')) {
    balanceDisplay = `${balance} GOLDIES`
  } else {
    balanceDisplay = balance
  }

  const debugInfo = JSON.stringify({ frameData, verified, fid, address, balance }, null, 2)

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f0f0f0', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>Your GOLDIES Balance</h1>
        <p style={{ fontSize: '36px', textAlign: 'center' }}>{address ? balanceDisplay : 'No connected Ethereum address found'}</p>
        <p style={{ fontSize: '24px', marginTop: '20px', textAlign: 'center' }}>Farcaster ID: {fid !== undefined ? fid : 'Not available'}</p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>Address: {address || 'Not available'}</p>
        <p style={{ fontSize: '14px', marginTop: '20px', maxWidth: '100%', wordWrap: 'break-word', textAlign: 'left' }}>Debug Info: {debugInfo}</p>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
      <Button action="/check">Refresh Balance</Button>
    ]
  })
})

export const GET = handle(app)
export const POST = handle(app)