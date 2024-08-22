import { Button, Frog, FrameContext } from 'frog'
import { devtools } from 'frog/dev'
import { serveStatic } from 'frog/serve-static'
import { handle } from 'frog/vercel'
import { ethers } from 'ethers'

export const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  title: 'GOLDIES Token Tracker',
})

const GOLDIES_TOKEN_ADDRESS = '0x3150E01c36ad3Af80bA16C1836eFCD967E96776e'
const POLYGON_RPC_URL = 'https://polygon-rpc.com'

const ABI = [
  'function balanceOf(uint256 fid) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

async function getGoldiesBalance(fid: number): Promise<string> {
  const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL)
  const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider)
  
  const balance = await contract.balanceOf(fid)
  const decimals = await contract.decimals()
  
  return ethers.formatUnits(balance, decimals)
}

// Define the structure of the verified object
interface Verified {
  fid: number;
}

// Type guard to check if an object is of type Verified
function isVerified(obj: any): obj is Verified {
  return typeof obj === 'object' && obj !== null && 'fid' in obj && typeof obj.fid === 'number';
}

app.frame('/', (c) => {
  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background: 'white',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          position: 'relative',
        }}
      >
        <img
          src="https://amaranth-adequate-condor-278.mypinata.cloud/ipfs/QmVfEoPSGHFGByQoGxUUwPq2qzE4uKXT7CSKVaigPANmjZ"
          alt="GOLDIES Token"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '0',
            right: '0',
            color: 'white',
            fontSize: '36px',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          Check Your GOLDIES Balance
        </div>
      </div>
    ),
    intents: [
      <Button action="/check-balance">Check Balance</Button>,
    ],
  })
})

app.frame('/check-balance', async (c: FrameContext) => {
  const { frameData, verified } = c
  let balance = '0'
  let fid: number | undefined

  if (isVerified(verified)) {
    fid = verified.fid
  }

  if (fid !== undefined) {
    try {
      balance = await getGoldiesBalance(fid)
    } catch (error) {
      console.error('Error fetching balance:', error)
      balance = 'Error fetching balance'
    }
  }

  return c.res({
    image: (
      <div
        style={{
          alignItems: 'center',
          background: 'linear-gradient(to right, #FFD700, #FFA500)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          padding: '20px',
        }}
      >
        <div
          style={{
            color: 'black',
            fontSize: 48,
            fontWeight: 'bold',
            marginBottom: 20,
          }}
        >
          Your GOLDIES Balance
        </div>
        <div
          style={{
            color: 'black',
            fontSize: 36,
            marginTop: 20,
          }}
        >
          {fid !== undefined ? `${balance} GOLDIES` : 'No connected Farcaster account found'}
        </div>
        <div
          style={{
            color: 'black',
            fontSize: 24,
            marginTop: 20,
          }}
        >
          Farcaster ID: {fid !== undefined ? fid : 'Not available'}
        </div>
        <div
          style={{
            color: 'black',
            fontSize: 14,
            marginTop: 20,
            wordWrap: 'break-word',
            maxWidth: '100%',
          }}
        >
          Debug Info: {JSON.stringify({ frameData, verified }, null, 2)}
        </div>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
      <Button action="/check-balance">Refresh Balance</Button>,
    ],
  })
})

const isProduction = process.env.NODE_ENV === 'production'
devtools(app, isProduction ? { assetsPath: '/.frog' } : { serveStatic })

export const GET = handle(app)
export const POST = handle(app)