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
  let errorMessage = '';
  try {
    console.log(`Attempting to fetch balance for address: ${address} on Polygon network`);
    
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL, POLYGON_CHAIN_ID);
    console.log('Polygon provider created');
    
    const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider);
    console.log('Contract instance created on Polygon');
    
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

app.frame('/', (c) => {
  return c.res({
    image: (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <img
          src="https://amaranth-adequate-condor-278.mypinata.cloud/ipfs/QmVfEoPSGHFGByQoGxUUwPq2qzE4uKXT7CSKVaigPANmjZ"
          alt="$GOLDIES Token"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
        <h1 style={{
          position: 'absolute',
          bottom: '20px',
          left: '0',
          right: '0',
          textAlign: 'center',
          color: 'white',
          fontSize: '48px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          Check Your $GOLDIES balance
        </h1>
      </div>
    ),
    intents: [
      <Button action="/check">Check Balance</Button>,
    ]
  })
})

app.frame('/check', async (c) => {
  const { frameData, verified } = c;
  const fid = frameData?.fid as number | undefined;
  
  // Use a more flexible type assertion
  const verifiedData = verified as { [key: string]: any } | boolean;
  
  let address: string | undefined;
  if (typeof verifiedData === 'object' && verifiedData !== null) {
    if (Array.isArray(verifiedData.etherAddresses) && verifiedData.etherAddresses.length > 0) {
      address = verifiedData.etherAddresses[0];
    } else if (typeof verifiedData.custody === 'string') {
      address = verifiedData.custody;
    }
  }

  let balance = 'N/A';

  if (address) {
    balance = await getGoldiesBalance(address);
  }

  let balanceDisplay = '';
  if (balance === '0.00') {
    balanceDisplay = "You don't have any $GOLDIES tokens on Polygon yet!";
  } else if (!balance.startsWith('Error')) {
    balanceDisplay = `${balance} $GOLDIES on Polygon`;
  } else {
    balanceDisplay = balance;
  }

  const debugInfo = JSON.stringify({
    frameData,
    verified: verifiedData,
    fid,
    address,
    balance,
    network: 'Polygon',
    chainId: POLYGON_CHAIN_ID
  }, null, 2);

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#FF8B19', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>Your $GOLDIES Balance on Polygon</h1>
        <p style={{ fontSize: '36px', textAlign: 'center' }}>{address ? balanceDisplay : 'No connected Ethereum address found'}</p>
        <p style={{ fontSize: '24px', marginTop: '20px', textAlign: 'center' }}>Farcaster ID: {fid !== undefined ? fid : 'Not available'}</p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>Address: {address || 'Not available'}</p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>Network: Polygon (Chain ID: {POLYGON_CHAIN_ID})</p>
        {DEBUG && (
          <p style={{ fontSize: '14px', marginTop: '20px', maxWidth: '100%', wordWrap: 'break-word', textAlign: 'left' }}>Debug Info: {debugInfo}</p>
        )}
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
      <Button.Link href="https://polygonscan.com/token/0x3150e01c36ad3af80ba16c1836efcd967e96776e">Polygonscan</Button.Link>,
      <Button action="/check">Refresh Balance</Button>,
      !address ? <Button action="/connect">Connect Wallet</Button> : null
    ]
  });
});

export const GET = handle(app);
export const POST = handle(app);