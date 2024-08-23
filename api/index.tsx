import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { ethers } from 'ethers'

const DEBUG = true; // Set to true to show debug info

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 630 },
  title: '$GOLDIES Token Tracker on Polygon',
})

const GOLDIES_TOKEN_ADDRESS = '0x3150E01c36ad3Af80bA16C1836eFCD967E96776e'
const ALCHEMY_POLYGON_URL = 'https://polygon-mainnet.g.alchemy.com/v2/pe-VGWmYoLZ0RjSXwviVMNIDLGwgfkao'
const POLYGON_CHAIN_ID = 137

const ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

async function getGoldiesBalance(address: string): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(ALCHEMY_POLYGON_URL, POLYGON_CHAIN_ID);
    const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider);
    
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    
    const formattedBalance = ethers.formatUnits(balance, decimals);
    
    return Number(formattedBalance).toFixed(2);
  } catch (error) {
    console.error('Error in getGoldiesBalance:', error);
    return 'Error: Unable to fetch balance';
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

  let address: string | undefined;
  let balance = 'N/A';
  let balanceDisplay = '';

  // Try to get the actual wallet address
  if (typeof verified === 'object' && verified !== null) {
    address = (verified as any).interactor?.verified_accounts?.[0] || 
              (verified as any).walletAddress ||
              (verified as any).ethAddress;
  }

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
    balanceDisplay = 'No wallet address found';
  }

  const debugInfo = JSON.stringify({
    frameData,
    verified,
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
        <p style={{ fontSize: '36px', textAlign: 'center' }}>{balanceDisplay}</p>
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
      <Button action="/check">Refresh Balance</Button>
    ]
  });
});

export const GET = handle(app);
export const POST = handle(app);