import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { ethers } from 'ethers'

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 630 },
  title: 'DEGEN Token Tracker on Base Chain',
})

// Update the token address and network details for $DEGEN on the Base chain
const DEGEN_TOKEN_ADDRESS = '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed'
const BASE_RPC_URL = 'https://mainnet.base.org'
const BASE_CHAIN_ID = 8453

const ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

function fidToAddress(fid: number): string {
  return ethers.getAddress(`0x${fid.toString(16).padStart(40, '0')}`)
}

async function getDegenBalance(fid: number): Promise<string> {
  let errorMessage = '';
  try {
    console.log(`Attempting to fetch balance for FID: ${fid} on Base chain`);
    
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL, BASE_CHAIN_ID);
    console.log('Base chain provider created');
    
    const contract = new ethers.Contract(DEGEN_TOKEN_ADDRESS, ABI, provider);
    console.log('Contract instance created on Base chain');
    
    const address = fidToAddress(fid);
    console.log(`Converted FID to address: ${address}`);
    
    const balance = await contract.balanceOf(address);
    console.log(`Raw balance on Base chain: ${balance.toString()}`);
    
    const decimals = await contract.decimals();
    console.log(`Decimals: ${decimals}`);
    
    const formattedBalance = ethers.formatUnits(balance, decimals);
    console.log(`Formatted balance on Base chain: ${formattedBalance}`);
    
    return Number(formattedBalance).toFixed(2);
  } catch (error) {
    console.error('Error in getDegenBalance on Base chain:', error);
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('CALL_EXCEPTION')) {
        errorMessage = 'Contract call failed on Base chain. The balance may not be available for this address.';
      }
    } else {
      errorMessage = 'Unknown error on Base chain';
    }
    return `Error on Base chain: ${errorMessage}`;
  } finally {
    console.log(`Balance fetch attempt completed on Base chain. Error: ${errorMessage}`);
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
          alt="DEGEN Token"
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
          fontSize: '36px',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>
          Check Your DEGEN Balance on Base Chain
        </h1>
      </div>
    ),
    intents: [
      <Button action="/check">Check Balance</Button>,
    ]
  })
})

app.frame('/connect', (c) => {
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f0f0f0', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>Connect Your Wallet</h1>
        <p style={{ fontSize: '24px', textAlign: 'center' }}>To connect your wallet, please ensure you're using a Farcaster-compatible client.</p>
        <p style={{ fontSize: '24px', textAlign: 'center' }}>If you're already connected, try refreshing the frame.</p>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
      <Button action="/check">Check Balance</Button>
    ]
  })
})

app.frame('/check', async (c) => {
  const { frameData, verified } = c
  const fid = frameData?.fid as number | undefined
  const fidSource = fid ? 'frameData.fid' : 'Not found'

  let balance = 'N/A'
  if (fid !== undefined) {
    balance = await getDegenBalance(fid)
  }

  let balanceDisplay = ''
  if (balance === '0.00') {
    balanceDisplay = "You don't have any DEGEN tokens on Base chain yet!"
  } else if (!balance.startsWith('Error')) {
    balanceDisplay = `${balance} DEGEN on Base chain`
  } else {
    balanceDisplay = balance
  }

  const debugInfo = JSON.stringify({
    frameData,
    verified,
    fidSource,
    fid,
    balance,
    network: 'Base Chain',
    chainId: BASE_CHAIN_ID
  }, null, 2)

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f0f0f0', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>Your DEGEN Balance on Base Chain</h1>
        <p style={{ fontSize: '36px', textAlign: 'center' }}>{fid !== undefined ? balanceDisplay : 'No connected Farcaster account found'}</p>
        <p style={{ fontSize: '24px', marginTop: '20px', textAlign: 'center' }}>Farcaster ID: {fid !== undefined ? fid : 'Not available'}</p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>FID Source: {fidSource}</p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>Network: Base Chain (Chain ID: {BASE_CHAIN_ID})</p>
        <p style={{ fontSize: '14px', marginTop: '20px', maxWidth: '100%', wordWrap: 'break-word', textAlign: 'left' }}>Debug Info: {debugInfo}</p>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
      <Button action="/check">Refresh Balance</Button>,
      fid === undefined ? <Button action="/connect">Connect Wallet</Button> : null
    ]
  })
})

export const GET = handle(app)
export const POST = handle(app)
