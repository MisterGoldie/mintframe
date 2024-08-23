import { Button, Frog, TextInput } from 'frog'
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
    console.log(`Attempting to fetch balance for address: ${address}`)
    const provider = new ethers.JsonRpcProvider(ALCHEMY_POLYGON_URL, POLYGON_CHAIN_ID)
    console.log('Provider created')
    const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider)
    console.log('Contract instance created')
    
    const balance = await contract.balanceOf(address)
    console.log(`Raw balance: ${balance.toString()}`)
    
    const decimals = await contract.decimals()
    console.log(`Decimals: ${decimals}`)
    
    const formattedBalance = ethers.formatUnits(balance, decimals)
    console.log(`Formatted balance: ${formattedBalance}`)
    
    return Number(formattedBalance).toFixed(2)
  } catch (error) {
    console.error('Error in getGoldiesBalance:', error)
    if (error instanceof Error) {
      return `Error: ${error.message}`
    }
    return 'Error: Unable to fetch balance'
  }
}

app.frame('/', (c) => {
  const { frameData, status } = c
  const errorMessage = status === 'response' ? frameData?.inputText : null
  
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#FF8B19', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>$GOLDIES Balance Checker</h1>
        <p style={{ fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>Enter your Ethereum address to check your $GOLDIES balance on Polygon</p>
        {errorMessage && (
          <p style={{ fontSize: '18px', color: 'red', marginBottom: '20px', textAlign: 'center' }}>{errorMessage}</p>
        )}
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter your Ethereum address" />,
      <Button action="/check">Check Balance</Button>,
    ]
  })
})

app.frame('/check', async (c) => {
  const { frameData } = c
  const address = frameData?.inputText

  if (!address || !ethers.isAddress(address)) {
    return c.res({
      image: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#FF8B19', padding: '20px', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>Error</h1>
          <p style={{ fontSize: '24px', textAlign: 'center' }}>Invalid Ethereum address. Please enter a valid address.</p>
        </div>
      ),
      intents: [
        <Button action="/">Back</Button>
      ]
    })
  }

  let balance = await getGoldiesBalance(address)
  let balanceDisplay = ''

  if (balance === '0.00') {
    balanceDisplay = "You don't have any $GOLDIES tokens on Polygon yet!"
  } else if (!balance.startsWith('Error')) {
    balanceDisplay = `${Number(balance).toLocaleString()} $GOLDIES on Polygon`
  } else {
    balanceDisplay = balance
  }

  const debugInfo = JSON.stringify({
    frameData,
    address,
    balance,
    network: 'Polygon',
    chainId: POLYGON_CHAIN_ID
  }, null, 2)

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#FF8B19', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>Your $GOLDIES Balance</h1>
        <p style={{ fontSize: '36px', textAlign: 'center' }}>{balanceDisplay}</p>
        <p style={{ fontSize: '24px', marginTop: '20px', textAlign: 'center' }}>Address: {address}</p>
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
  })
})

export const GET = handle(app)
export const POST = handle(app)