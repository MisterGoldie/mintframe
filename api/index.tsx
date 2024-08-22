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
  'function balanceOf(uint256 fid) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

async function getGoldiesBalance(fid: number): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL)
    const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider)
    
    const balance = await contract.balanceOf(fid)
    const decimals = await contract.decimals()
    
    return ethers.formatUnits(balance, decimals)
  } catch (error) {
    console.error('Error fetching balance:', error)
    return 'Error fetching balance'
  }
}

app.frame('/', (c) => {
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}>
        <img
          src="https://amaranth-adequate-condor-278.mypinata.cloud/ipfs/QmVfEoPSGHFGByQoGxUUwPq2qzE4uKXT7CSKVaigPANmjZ"
          alt="GOLDIES Token"
          style={{ width: '80%', maxHeight: '70%', objectFit: 'contain' }}
        />
        <h1 style={{ fontSize: 36, marginTop: 20 }}>Check Your GOLDIES Balance</h1>
      </div>
    ),
    intents: [
      <Button action="/check">Check Balance</Button>
    ]
  })
})

// Define an interface for the verified object
interface VerifiedData {
  fid?: number;
}

// Type guard to check if the verified data is of type VerifiedData
function isVerifiedData(verified: unknown): verified is VerifiedData {
  return typeof verified === 'object' && verified !== null && 'fid' in verified;
}

app.frame('/check', async (c) => {
  const { frameData, verified } = c
  let fid: number | undefined;
  
  if (isVerifiedData(verified)) {
    fid = verified.fid;
  }
  
  let balance = 'N/A'
  if (fid !== undefined) {
    balance = await getGoldiesBalance(fid)
  }

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f0f0f0' }}>
        <h1 style={{ fontSize: 48, marginBottom: 20 }}>Your GOLDIES Balance</h1>
        <p style={{ fontSize: 36 }}>{fid !== undefined ? `${balance} GOLDIES` : 'No connected Farcaster account found'}</p>
        <p style={{ fontSize: 24, marginTop: 20 }}>Farcaster ID: {fid !== undefined ? fid : 'Not available'}</p>
        <p style={{ fontSize: 14, marginTop: 20, maxWidth: '80%', wordWrap: 'break-word' }}>
          Debug Info: {JSON.stringify({ frameData, verified, balance }, null, 2)}
        </p>
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