import { Button, Frog, TextInput } from 'frog';
import { handle } from 'frog/vercel';
import { ethers } from 'ethers';

export const app = new Frog({
  basePath: '/api',
  imageOptions: { width: 1200, height: 630 },
  title: '$GOLDIES Token Tracker on Polygon',
});

const GOLDIES_TOKEN_ADDRESS = '0x3150E01c36ad3Af80bA16C1836eFCD967E96776e';
const ALCHEMY_POLYGON_URL = 'https://polygon-mainnet.g.alchemy.com/v2/pe-VGWmYoLZ0RjSXwviVMNIDLGwgfkao';
const POLYGON_CHAIN_ID = 137;

const ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

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
  const { frameData, status } = c;
  const errorMessage = status === 'response' ? frameData?.inputText : null;

  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#FF8B19',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{ fontSize: '60px', marginBottom: '20px', textAlign: 'center' }}>
          $GOLDIES Balance Checker
        </h1>
        <p style={{ fontSize: '36px', marginBottom: '20px', textAlign: 'center' }}>
          Enter your Polygon address
        </p>
        {errorMessage && (
          <p style={{ fontSize: '18px', color: 'red', marginBottom: '20px', textAlign: 'center' }}>
            {errorMessage}
          </p>
        )}
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter your Polygon address" />,
      <Button action="/check">Check Balance</Button>,
    ],
  });
});

app.frame('/check', async (c) => {
  const { frameData } = c;
  const address = frameData?.inputText;

  if (!address || !ethers.isAddress(address)) {
    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#FF8B19',
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>Error</h1>
          <p style={{ fontSize: '36px', textAlign: 'center' }}>
            Invalid Polygon address. Please enter a valid address.
          </p>
        </div>
      ),
      intents: [
        <Button action="/">Back</Button>,
      ],
    });
  }

  let balance = await getGoldiesBalance(address);
  let balanceDisplay = '';

  if (balance === '0.00') {
    balanceDisplay = "You don't have any $GOLDIES tokens on Polygon yet!";
  } else if (!balance.startsWith('Error')) {
    balanceDisplay = `${Number(balance).toLocaleString()} $GOLDIES on Polygon`;
  } else {
    balanceDisplay = balance;
  }

  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#FF8B19',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textAlign: 'center' }}>
          Your $GOLDIES Balance
        </h1>
        <p style={{ fontSize: '36px', textAlign: 'center' }}>{balanceDisplay}</p>
        <p style={{ fontSize: '24px', marginTop: '20px', textAlign: 'center' }}>
          Address: {address}
        </p>
        <p style={{ fontSize: '24px', marginTop: '10px', textAlign: 'center' }}>
          Network: Polygon (Chain ID: {POLYGON_CHAIN_ID})
        </p>
      </div>
    ),
    intents: [
      <Button action="/">Back</Button>,
      <Button.Link href="https://polygonscan.com/token/0x3150e01c36ad3af80ba16c1836efcd967e96776e">Polygonscan</Button.Link>,
      <Button action={`/check?inputText=${address}`}>Refresh Balance</Button>, // Ensuring the address is passed again
    ],
  });
});

export const GET = handle(app);
export const POST = handle(app);
