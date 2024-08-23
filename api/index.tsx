import { Button, Frog, TextInput } from 'frog'
import { handle } from 'frog/vercel'
import { ethers } from 'ethers'
import fetch from 'node-fetch'

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
    const provider = new ethers.JsonRpcProvider(ALCHEMY_POLYGON_URL, POLYGON_CHAIN_ID)
    const contract = new ethers.Contract(GOLDIES_TOKEN_ADDRESS, ABI, provider)
    
    const balance = await contract.balanceOf(address)
    const decimals = await contract.decimals()
    
    const formattedBalance = ethers.formatUnits(balance, decimals)
    
    return Number(formattedBalance).toFixed(2)
  } catch (error) {
    console.error('Error in getGoldiesBalance:', error)
    return 'Error: Unable to fetch balance'
  }
}

async function getGoldiesMaticPrice(): Promise<number | null> {
  try {
    console.log('Fetching $GOLDIES price from DEX Screener...')
    const response = await fetch('https://api.dexscreener.com/latest/dex/pairs/polygon/0x19976577bb2fa3174b4ae4cf55e6795dde730135')
    const data = await response.json()
    console.log('DEX Screener API response:', JSON.stringify(data, null, 2))

    if (data.pair && data.pair.priceNative) {
      const priceInMatic = 1 / parseFloat(data.pair.priceNative)
      console.log('Calculated $GOLDIES price in MATIC:', priceInMatic)
      return priceInMatic
    } else {
      console.error('Invalid price data received from DEX Screener')
      // Fallback to a hardcoded approximation (you may want to update this value periodically)
      const fallbackPrice = 0.000001 // 1 GOLDIES = 0.000001 MATIC (example value)
      console.log('Using fallback price:', fallbackPrice)
      return fallbackPrice
    }
  } catch (error) {
    console.error('Error in getGoldiesMaticPrice:', error)
    return null
  }
}

app.frame('/', (c) => {
  const { frameData, status } = c
  const errorMessage = status === 'response' ? frameData?.inputText : null
  
  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#FF8B19', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '60px', marginBottom: '20px', textAlign: 'center' }}>$GOLDIES Balance Checker</h1>
        <p style={{ fontSize: '36px', marginBottom: '20px', textAlign: 'center' }}>Enter your Polygon address</p>
        {errorMessage && (
          <p style={{ fontSize: '18px', color: 'red', marginBottom: '20px', textAlign: 'center' }}>{errorMessage}</p>
        )}
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter your Polygon address" />,
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
          <p style={{ fontSize: '36px', textAlign: 'center' }}>Invalid Polygon address. Please enter a valid address.</p>
        </div>
      ),
      intents: [
        <Button action="/">Back</Button>
      ]
    })
  }

  const balance = await getGoldiesBalance(address)
  const priceInMatic = await getGoldiesMaticPrice()

  let balanceDisplay = ''
  let maticValueDisplay = ''

  if (balance === '0.00') {
    balanceDisplay = "You don't have any $GOLDIES tokens on Polygon yet!"
  } else if (!balance.startsWith('Error')) {
    const balanceNumber = parseFloat(balance)
    balanceDisplay = `${balanceNumber.toLocaleString()} $GOLDIES on Polygon`
    
    if (priceInMatic !== null) {
      const maticValue = balanceNumber * priceInMatic
      maticValueDisplay = `(~${maticValue.toFixed(8)} MATIC)`
    } else {
      maticValueDisplay = "(MATIC value calculation error)"
    }
  } else {
    balanceDisplay = balance
    maticValueDisplay = "Unable to calculate MATIC value"
  }

  return c.res({
    image: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', backgroundColor: '#FF8B19', padding: '20px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>Your $GOLDIES Balance</h1>
        <p style={{ fontSize: '36px', textAlign: 'center' }}>{balanceDisplay}</p>
        <p style={{ fontSize: '30px', textAlign: 'center' }}>{maticValueDisplay}</p>
        <p style={{ fontSize: '24px', marginTop: '20px', textAlign: 'center' }}>Address: {address}</p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>Network: Polygon (Chain ID: {POLYGON_CHAIN_ID})</p>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
      <Button.Link href="https://polygonscan.com/token/0x3150e01c36ad3af80ba16c1836efcd967e96776e">Polygonscan</Button.Link>,
    ]
  })
})

export const GET = handle(app)
export const POST = handle(app)