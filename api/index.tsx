import { Button, Frog } from 'frog'
import { handle } from 'frog/vercel'
import { ethers } from 'ethers'

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

// Array of hardcoded addresses to check
const HARDCODED_ADDRESSES = [
  '0xB57381C7eD83BB9031a786d2C691cc6C7C2207a4',
  '0x0FB966a06a23211A5dAA089744C532C785e5D26f',
  '0x123456789abcdef123456789abcdef123456789a' // Add more addresses as needed
];

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

async function getAllBalances(): Promise<{address: string, balance: string}[]> {
  const balances = await Promise.all(HARDCODED_ADDRESSES.map(async (address) => {
    const balance = await getGoldiesBalance(address);
    return { address, balance };
  }));
  return balances;
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
        overflow: 'hidden',
        backgroundColor: '#FFA500'
      }}>
        <img
          src="https://amaranth-adequate-condor-278.mypinata.cloud/ipfs/QmVfEoPSGHFGByQoGxUUwPq2qzE4uKXT7CSKVaigPANmjZ"
          alt="$GOLDIES Token"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'cover'
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
          Check $GOLDIES balances
        </h1>
      </div>
    ),
    intents: [
      <Button action="/check">Check Balances</Button>,
    ]
  })
})

app.frame('/check', async (c) => {
  const balances = await getAllBalances();

  const balanceDisplay = balances.map(({ address, balance }) => 
    `${address.slice(0, 6)}...${address.slice(-4)}: ${balance} $GOLDIES`
  ).join('\n');

  return c.res({
    image: (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#FFA500',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <h1 style={{
          fontSize: '36px',
          marginBottom: '20px',
          textAlign: 'center',
          color: 'white'
        }}>$GOLDIES Balances on Polygon</h1>
        <div style={{
          fontSize: '18px',
          textAlign: 'center',
          color: 'white',
          whiteSpace: 'pre-wrap'
        }}>
          {balanceDisplay}
        </div>
        <p style={{
          fontSize: '18px',
          marginTop: '20px',
          textAlign: 'center',
          color: 'white'
        }}>Network: Polygon (Chain ID: {POLYGON_CHAIN_ID})</p>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
      <Button.Link href="https://polygonscan.com/token/0x3150e01c36ad3af80ba16c1836efcd967e96776e">Polygonscan</Button.Link>,
      <Button action="/check">Refresh Balances</Button>
    ]
  });
});

export const GET = handle(app);
export const POST = handle(app);