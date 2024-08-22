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
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
]

async function getGoldiesBalance(fid: number): Promise<string> {
  try {
    console.log(`Attempting to fetch balance for FID: ${fid}`)
    const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL)
    console.log('Provider created')
    
    const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider)
    console.log('Contract instance created')
    
    // Convert FID to Ethereum address (this is a placeholder, you might need to adjust this)
    const address = ethers.getAddress(`0x${fid.toString(16).padStart(40, '0')}`)
    console.log(`Converted FID to address: ${address}`)
    
    const balance = await contract.balanceOf(address)
    console.log(`Raw balance: ${balance.toString()}`)
    
    const decimals = await contract.decimals()
    console.log(`Decimals: ${decimals}`)
    
    const formattedBalance = ethers.formatUnits(balance, decimals)
    console.log(`Formatted balance: ${formattedBalance}`)
    
    return formattedBalance
  } catch (error) {
    console.error('Error in getGoldiesBalance:', error)
    if (error instanceof Error) {
      return `Error: ${error.message}`
    }
    return 'Unknown error fetching balance'
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

app.frame('/check', async (c) => {
  const debugInfo: any = {
    frameData: c.frameData,
    verified: c.verified,
  }

  let fid: number | undefined
  let fidSource = 'Not found'

  const frameData = c.frameData as { fid?: number } | null

  if (frameData && typeof frameData.fid === 'number') {
    fid = frameData.fid
    fidSource = 'frameData.fid'
  }

  debugInfo.fidSource = fidSource
  debugInfo.fid = fid

  let balance = 'N/A'
  if (fid !== undefined) {
    balance = await getGoldiesBalance(fid)
  }

  debugInfo.balance = balance

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#f0f0f0', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: 48, marginBottom: 20, textAlign: 'center' }}>Your GOLDIES Balance</h1>
        <p style={{ fontSize: 36, textAlign: 'center' }}>{fid !== undefined ? `${balance} GOLDIES` : 'No connected Farcaster account found'}</p>
        <p style={{ fontSize: 24, marginTop: 20, textAlign: 'center' }}>Farcaster ID: {fid !== undefined ? fid : 'Not available'}</p>
        <p style={{ fontSize: 24, marginTop: 10, textAlign: 'center' }}>FID Source: {fidSource}</p>
        <p style={{ fontSize: 14, marginTop: 20, maxWidth: '100%', wordWrap: 'break-word', textAlign: 'left' }}>
          Debug Info: {JSON.stringify(debugInfo, null, 2)}
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