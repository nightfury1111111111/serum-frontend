import {
  Connection,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  Keypair,
  TransactionSignature,
  SimulatedTransactionResponse,
  Commitment,
  RpcResponseAndContext,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import Wallet from '@project-serum/sol-wallet-adapter';
import * as BufferLayout from '@solana/buffer-layout/lib/Layout';
import * as solanaWeb3 from '@solana/web3.js';
import nacl from 'tweetnacl';
import { Account } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import axios from 'axios';
import {
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Market,
  MARKETS,
  parseInstructionErrorResponse,
  Orderbook,
} from '@project-serum/serum';
//import market from './market.json';
import { TOKEN_MINTS } from '@project-serum/serum';
import { Order } from '@project-serum/serum/lib/market';
import { resolve } from 'dns';

const Base_Url = 'http://localhost:3200';
const DEFAULT_TIMEOUT = 15000;

let provider = 'https://www.sollet.io';
let connection = new Connection('https://solana-api.projectserum.com');
// For sollet extension use
// provider = window.sollet

let wallet = new Wallet(provider, '');

export const DERIVATION_PATH = {
  deprecated: undefined,
  bip44: 'bip44',
  bip44Change: 'bip44Change',
  bip44Root: 'bip44Root', // Ledger only.
};

//connect to the wallet
export const connectWallet = async () => {
  wallet.on('connect', (publicKey: any) => {
    console.log('Connected to ' + publicKey.toBase58());
  });
  wallet.on('disconnect', () => console.log('Disconnected'));
  await wallet.connect();
};

//have to get account public key from the connect
export const getTokenAccount = async () => {
  let connection = new Connection('https://solana-api.projectserum.com');
  let accounts = await getOwnedTokenAccounts(
    connection,
    wallet.publicKey ||
    new PublicKey('63Z9RHLvodKaq1A4RpWadB3LNrb8SeD4PvdcfRuGpQDm'),
  );
};

export const getOwnedTokenAccounts = async (
  connection: Connection,
  publicKey: PublicKey,
) => {
  let filters: any = getOwnedAccountsFilters(publicKey);
  let resp = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
    filters,
  });
  return resp.map(
    ({ pubkey, account: { data, executable, owner, lamports } }) => ({
      publicKey: new PublicKey(pubkey),
      accountInfo: {
        data,
        executable,
        owner: new PublicKey(owner),
        lamports,
      },
    }),
  );
};

export const getOwnedAccountsFilters = (publicKey: PublicKey) => {
  return [
    {
      memcmp: {
        offset: ACCOUNT_LAYOUT.offsetOf('owner'),
        bytes: publicKey.toBase58(),
      },
    },
    {
      dataSize: ACCOUNT_LAYOUT.span,
    },
  ];
};

export const parseTokenAccountData = (data: any) => {
  //@ts-ignore
  let { mint, owner, amount } = ACCOUNT_LAYOUT.decode(data);
  return {
    mint: new PublicKey(mint),
    owner: new PublicKey(owner),
    amount,
  };
};

// // export const addTokenAccount = async (params: any) => {
// //   let mint = new PublicKey(params.mintAddress);
// //   // updateTokenName(mint, tokenName, tokenSymbol);
// //   const resp = await createAssociatedTokenAccount(mint);
// //   // return resp[1];
// // };

// //mintAddress: "2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk"
// //tokenName: 'Wrapped Ethereum (Sollet)';
// //tokenSymbol: 'soETH';

// export const createAssociatedTokenAccount = async (
//   splTokenMintAddress: PublicKey,
// ) => {
//   let connection = new Connection(clusterApiUrl('testnet'));
//   const [ix, address] = await createAssociatedTokenAccountIx(
//     new PublicKey('63Z9RHLvodKaq1A4RpWadB3LNrb8SeD4PvdcfRuGpQDm'),
//     new PublicKey('63Z9RHLvodKaq1A4RpWadB3LNrb8SeD4PvdcfRuGpQDm'),
//     splTokenMintAddress,
//   );

//   const tx = new Transaction();
//   //@ts-ignore
//   tx.add(ix);
//   tx.feePayer = new PublicKey('63Z9RHLvodKaq1A4RpWadB3LNrb8SeD4PvdcfRuGpQDm');

//   const txSig = await signAndSendTransaction(connection, tx, []);

//   return [address, txSig];
// };

// export const createAssociatedTokenAccountIx = async (
//   fundingAddress: PublicKey,
//   walletAddress: PublicKey,
//   splTokenMintAddress: PublicKey,
// ) => {
//   const associatedTokenAddress = await findAssociatedTokenAddress(
//     walletAddress,
//     splTokenMintAddress,
//   );
//   const systemProgramId = new PublicKey('11111111111111111111111111111111');
//   const keys = [
//     {
//       pubkey: fundingAddress,
//       isSigner: true,
//       isWritable: true,
//     },
//     {
//       pubkey: associatedTokenAddress,
//       isSigner: false,
//       isWritable: true,
//     },
//     {
//       pubkey: walletAddress,
//       isSigner: false,
//       isWritable: false,
//     },
//     {
//       pubkey: splTokenMintAddress,
//       isSigner: false,
//       isWritable: false,
//     },
//     {
//       pubkey: systemProgramId,
//       isSigner: false,
//       isWritable: false,
//     },
//     {
//       pubkey: TOKEN_PROGRAM_ID,
//       isSigner: false,
//       isWritable: false,
//     },
//     {
//       pubkey: SYSVAR_RENT_PUBKEY,
//       isSigner: false,
//       isWritable: false,
//     },
//   ];
//   const ix = new TransactionInstruction({
//     keys,
//     programId: ASSOCIATED_TOKEN_PROGRAM_ID,
//     data: Buffer.from([]),
//   });
//   return [ix, associatedTokenAddress];
// };

// export const findAssociatedTokenAddress = async (
//   walletAddress: PublicKey,
//   tokenMintAddress: PublicKey,
// ) => {
//   return (
//     await PublicKey.findProgramAddress(
//       [
//         walletAddress.toBuffer(),
//         TOKEN_PROGRAM_ID.toBuffer(),
//         tokenMintAddress.toBuffer(),
//       ],
//       ASSOCIATED_TOKEN_PROGRAM_ID,
//     )
//   )[0];
// };

// export const signAndSendTransaction = async (
//   connection: any,
//   transaction: any,
//   signers: any,
//   skipPreflight = false,
// ) => {
//   transaction.recentBlockhash = (
//     await connection.getRecentBlockhash('max')
//   ).blockhash;
//   transaction.setSigners(
//     // fee payed by the wallet owner
//     new PublicKey('63Z9RHLvodKaq1A4RpWadB3LNrb8SeD4PvdcfRuGpQDm'),
//     ...signers.map((s: any) => s.publicKey),
//   );

//   if (signers.length > 0) {
//     transaction.partialSign(...signers);
//   }
//   transaction = await signTransaction(transaction);
//   const rawTransaction = transaction.serialize();
//   // console.log(rawTransaction);
//   return await connection.sendRawTransaction(rawTransaction, {
//     skipPreflight,
//     preflightCommitment: 'single',
//   });
// };

// export const signTransaction = async (transaction: any) => {
//   let mnemonic =
//     'tuition hidden join spend custom brass casino lazy device try fiction beach spice curtain chronic network poet horn vapor sea arm assist settle cube';
//   const bip39 = await import('bip39');
//   const seed = await bip39.mnemonicToSeed(mnemonic);

//   let account = await getAccountFromSeed(
//     //@ts-ignore
//     seed,
//     0,
//     //@ts-ignore
//     DERIVATION_PATH.bip44Change,
//   );
//   transaction.partialSign(account);
//   return transaction;
// };

// export const mnemonicToSeed = async (mnemonic: any) => {
//   const bip39 = await import('bip39');
//   if (!bip39.validateMnemonic(mnemonic)) {
//     throw new Error('Invalid seed words');
//   }
//   const seed = await bip39.mnemonicToSeed(mnemonic);
//   return Buffer.from(seed).toString('hex');
// };

// export const getAccountFromSeed = (
//   seed: any,
//   walletIndex: number,
//   dPath = undefined,
//   accountIndex = 0,
// ) => {
//   const derivedSeed = deriveSeed(seed, walletIndex, dPath, accountIndex);
//   return new Account(nacl.sign.keyPair.fromSeed(derivedSeed).secretKey);
// };

// export const deriveSeed = (
//   seed: any,
//   walletIndex: number,
//   derivationPath: any,
//   accountIndex: number,
// ) => {
//   switch (derivationPath) {
//     case DERIVATION_PATH.deprecated:
//       const path = `m/501'/${walletIndex}'/0/${accountIndex}`;
//       //@ts-ignore
//       return bip32.fromSeed(seed).derivePath(path).privateKey;
//     case DERIVATION_PATH.bip44:
//       const path44 = `m/44'/501'/${walletIndex}'`;
//       return derivePath(path44, seed).key;
//     case DERIVATION_PATH.bip44Change:
//       const path44Change = `m/44'/501'/${walletIndex}'/0'`;
//       return derivePath(path44Change, seed).key;
//     default:
//       throw new Error(`invalid derivation path: ${derivationPath}`);
//   }
// };

export const ACCOUNT_LAYOUT = BufferLayout.struct([
  // @ts-ignore
  BufferLayout.blob(32, 'mint'),
  // @ts-ignore
  BufferLayout.blob(32, 'owner'),
  // @ts-ignore
  BufferLayout.nu64('amount'),
  // @ts-ignore
  BufferLayout.blob(93),
]);

//Placeorder
export const getOrderTesting = async (trade: any) => {
  let crrMarket: any = {};
  MARKETS.forEach((item) => {
    if (item.name === trade.name) crrMarket = item;
  });

  if (!crrMarket || Object.keys(crrMarket).length === 0)
    alert('Invalid name input');
  else {
    let market = await Market.load(
      connection,
      crrMarket.address,
      undefined,
      crrMarket.programId,
    );
    const baseAccountName = trade.name.split('/')[0];
    const quoteAccountName = trade.name.split('/')[1];
    let accounts = await getOwnedTokenAccounts(
      connection,
      wallet.publicKey ||
      new PublicKey('63Z9RHLvodKaq1A4RpWadB3LNrb8SeD4PvdcfRuGpQDm'),
    );
    let myAccountToken: object[] = [];
    accounts &&
      accounts.forEach((account) => {
        TOKEN_MINTS.forEach((token) => {
          if (
            token.address.toBase58() ===
            parseTokenAccountData(account.accountInfo.data).mint.toBase58()
          )
            myAccountToken.push({ token, account: account.publicKey });
        });
      });
    const assignAccount = async (accountName: string) => {
      let returnValue;
      if (accountName === 'SOL') returnValue = wallet.publicKey;
      else {
        await myAccountToken.forEach((item: any) => {
          if (item.token.name === accountName) returnValue = item.account;
        });
      }
      return returnValue;
    };
    let baseCurrencyAccount = await assignAccount(baseAccountName);
    let quoteCurrencyAccount = await assignAccount(quoteAccountName);

    await placeOrder({
      //@ts-ignore
      side: trade.side,
      price: trade.price,
      size: trade.size,
      orderType: 'limit',
      market,
      connection: connection,
      wallet,
      baseCurrencyAccount:
        baseCurrencyAccount !== null ? baseCurrencyAccount : undefined,
      quoteCurrencyAccount:
        quoteCurrencyAccount !== null ? quoteCurrencyAccount : undefined,
      feeDiscountPubkey: undefined,
    });
  }
};

export const placeOrder = async ({
  side,
  price,
  size,
  orderType,
  market,
  connection,
  wallet,
  baseCurrencyAccount,
  quoteCurrencyAccount,
  feeDiscountPubkey: undefined,
}: {
  side: string;
  price: number;
  size: number;
  orderType: string;
  market: Market;
  connection: Connection;
  wallet: Wallet;
  baseCurrencyAccount: PublicKey | undefined | null;
  quoteCurrencyAccount: PublicKey | undefined | null;
  feeDiscountPubkey: PublicKey | undefined;
}) => {
  const owner = wallet.publicKey;
  const transaction = new Transaction();
  const signers: Account[] = [];
  if (!baseCurrencyAccount) {
    const {
      transaction: createAccountTransaction,
      newAccountPubkey,
    } = await createTokenAccountTransaction({
      connection,
      wallet,
      mintPublicKey: market.baseMintAddress,
    });
    transaction.add(createAccountTransaction);
    baseCurrencyAccount = newAccountPubkey;
  }
  if (!quoteCurrencyAccount) {
    const {
      transaction: createAccountTransaction,
      newAccountPubkey,
    } = await createTokenAccountTransaction({
      connection,
      wallet,
      mintPublicKey: market.quoteMintAddress,
    });

    transaction.add(createAccountTransaction);
    quoteCurrencyAccount = newAccountPubkey;
  }
  let payer = side === 'sell' ? baseCurrencyAccount : quoteCurrencyAccount;
  const params = {
    owner,
    payer,
    side,
    price,
    size,
    orderType,
    feeDiscountPubkey: null,
  };
  const matchOrderstransaction = market.makeMatchOrdersTransaction(5);
  transaction.add(matchOrderstransaction);
  const startTime = getUnixTs();
  let {
    transaction: placeOrderTx,
    signers: placeOrderSigners,
  } = await market.makePlaceOrderTransaction(
    connection,
    //@ts-ignore
    params,
    120_000,
    120_000,
  );
  const endTime = getUnixTs();
  transaction.add(placeOrderTx);
  transaction.add(market.makeMatchOrdersTransaction(5));
  signers.push(...placeOrderSigners);

  return await sendTransaction({
    transaction,
    wallet,
    connection,
    signers,
    sendingMessage: 'Sending order...',
  });
};

export const createTokenAccountTransaction = async ({
  connection,
  wallet,
  mintPublicKey,
}: {
  connection: Connection;
  wallet: Wallet;
  mintPublicKey: PublicKey;
}): Promise<{
  transaction: Transaction;
  newAccountPubkey: PublicKey;
}> => {
  let newPublicKey = new PublicKey(
    '63Z9RHLvodKaq1A4RpWadB3LNrb8SeD4PvdcfRuGpQDm',
  );
  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mintPublicKey,
    wallet.publicKey || newPublicKey,
  );
  const transaction = new Transaction();
  transaction.add(
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mintPublicKey,
      ata,
      wallet.publicKey || newPublicKey,
      wallet.publicKey || newPublicKey,
    ),
  );
  return {
    transaction,
    newAccountPubkey: ata,
  };
};

export const getUnixTs = () => {
  return new Date().getTime() / 1000;
};

export const getDecimalCount = (value: any): number => {
  if (
    !isNaN(value) &&
    Math.floor(value) !== value &&
    value.toString().includes('.')
  )
    return value.toString().split('.')[1].length || 0;
  if (
    !isNaN(value) &&
    Math.floor(value) !== value &&
    value.toString().includes('e')
  )
    return parseInt(value.toString().split('e-')[1] || '0');
  return 0;
};

export const sendTransaction = async ({
  transaction,
  wallet,
  signers = [],
  connection,
  sendingMessage = 'Sending transaction...',
  sentMessage = 'Transaction sent',
  successMessage = 'Transaction confirmed',
  timeout = DEFAULT_TIMEOUT,
  sendNotification = true,
}: {
  transaction: Transaction;
  wallet: Wallet;
  signers?: Array<Account>;
  connection: Connection;
  sendingMessage?: string;
  sentMessage?: string;
  successMessage?: string;
  timeout?: number;
  sendNotification?: boolean;
}) => {
  console.log(1);
  await signTransactionOrder({
    transaction,
    wallet,
    signers,
    connection,
  });
  return await sendSignedTransaction({
    //@ts-ignore
    signedTransaction,
    connection,
    sendingMessage,
    sentMessage,
    successMessage,
    timeout,
    sendNotification,
  });
};

export const sendSignedTransaction = async ({
  signedTransaction,
  connection,
  sendingMessage = 'Sending transaction...',
  sentMessage = 'Transaction sent',
  successMessage = 'Transaction confirmed',
  timeout = DEFAULT_TIMEOUT,
  sendNotification = true,
}: {
  signedTransaction: Transaction;
  connection: Connection;
  sendingMessage?: string;
  sentMessage?: string;
  successMessage?: string;
  timeout?: number;
  sendNotification?: boolean;
}): Promise<string> => {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();

  const txid: TransactionSignature = await connection.sendRawTransaction(
    rawTransaction,
    {
      skipPreflight: true,
    },
  );

  console.log('Started awaiting confirmation for', txid);

  let done = false;
  (async () => {
    while (!done && getUnixTs() - startTime < timeout) {
      connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      await sleep(300);
    }
  })();
  try {
    await awaitTransactionSignatureConfirmation(txid, timeout, connection);
  } catch (err) {
    //@ts-ignore
    if (err.timeout) {
      throw new Error('Timed out awaiting confirmation on transaction');
    }
    let simulateResult: SimulatedTransactionResponse | null = null;
    try {
      simulateResult = (
        await simulateTransaction(connection, signedTransaction, 'single')
      ).value;
    } catch (e) { }
    if (simulateResult && simulateResult.err) {
      if (simulateResult.logs) {
        for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
          const line = simulateResult.logs[i];
          if (line.startsWith('Program log: ')) {
            throw new Error(
              'Transaction failed: ' + line.slice('Program log: '.length),
            );
          }
        }
      }
      let parsedError;
      if (
        typeof simulateResult.err == 'object' &&
        'InstructionError' in simulateResult.err
      ) {
        const parsedErrorInfo = parseInstructionErrorResponse(
          signedTransaction,
          simulateResult.err['InstructionError'],
        );
        parsedError = parsedErrorInfo.error;
      } else {
        parsedError = JSON.stringify(simulateResult.err);
      }
      throw new Error(parsedError);
    }
    throw new Error('Transaction failed');
  } finally {
    done = true;
  }

  console.log('Latency', txid, getUnixTs() - startTime);
  return txid;
};

export async function sleep(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const awaitTransactionSignatureConfirmation = async (
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
) => {
  let done = false;
  const result = await new Promise((resolve, reject) => {
    (async () => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        console.log('Timed out for txid', txid);
        reject({ timeout: true });
      }, timeout);
      try {
        connection.onSignature(
          txid,
          (result) => {
            console.log('WS confirmed', txid, result);
            done = true;
            if (result.err) {
              reject(result.err);
            } else {
              resolve(result);
            }
          },
          'recent',
        );
        console.log('Set up WS connection', txid);
      } catch (e) {
        done = true;
        console.log('WS error in setup', txid, e);
      }
      while (!done) {
        // eslint-disable-next-line no-loop-func
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            const result = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!result) {
                console.log('REST null result for', txid, result);
              } else if (result.err) {
                console.log('REST error for', txid, result);
                done = true;
                reject(result.err);
              } else if (!result.confirmations) {
                console.log('REST no confirmations for', txid, result);
              } else {
                console.log('REST confirmation for', txid, result);
                done = true;
                resolve(result);
              }
            }
          } catch (e) {
            if (!done) {
              console.log('REST connection error: txid', txid, e);
            }
          }
        })();
        await sleep(300);
      }
    })();
  });
  done = true;
  return result;
};

export const simulateTransaction = async (
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> => {
  // @ts-ignore
  transaction.recentBlockhash = await connection._recentBlockhash(
    // @ts-ignore
    connection._disableBlockhashCaching,
  );

  const signData = transaction.serializeMessage();
  // @ts-ignore
  const wireTransaction = transaction._serialize(signData);
  const encodedTransaction = wireTransaction.toString('base64');
  const config: any = { encoding: 'base64', commitment };
  const args = [encodedTransaction, config];

  // @ts-ignore
  const res = await connection._rpcRequest('simulateTransaction', args);
  if (res.error) {
    throw new Error('failed to simulate transaction: ' + res.error.message);
  }
  return res.result;
};

export const signTransactionOrder = async ({
  transaction,
  wallet,
  signers = [],
  connection,
}: {
  transaction: Transaction;
  wallet: Wallet;
  signers?: Array<Account>;
  connection: Connection;
}) => {
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash;
  if (wallet.publicKey)
    transaction.setSigners(
      wallet.publicKey,
      ...signers.map((s) => s.publicKey),
    );
  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  const secretKey = Uint8Array.from([
    203,
    192,
    234,
    104,
    187,
    176,
    16,
    169,
    149,
    21,
    185,
    8,
    159,
    113,
    200,
    213,
    123,
    52,
    76,
    235,
    68,
    39,
    100,
    160,
    81,
    146,
    86,
    234,
    3,
    193,
    146,
    187,
    47,
    105,
    105,
    230,
    119,
    128,
    55,
    91,
    66,
    126,
    246,
    180,
    109,
    79,
    138,
    46,
    243,
    35,
    179,
    165,
    82,
    67,
    150,
    74,
    99,
    174,
    79,
    1,
    34,
    95,
    213,
    126,
  ]);
  const aaa = Keypair.fromSecretKey(secretKey);
  console.log(aaa.publicKey.toBase58());
  await sendAndConfirmTransaction(connection, transaction, [aaa])
    .then((res) => console.log(res))
    .catch((err) => console.log('error', err));
  // return await wallet.signTransaction(transaction);
};

// export function getMarketOrderPrice(
//   orderbook: Orderbook,
//   cost: number,
//   tickSizeDecimals?: number,
// ) {
//   if (orderbook.isBids) {
//     return orderbook.market.tickSize;
//   }
//   let spentCost = 0;
//   let price, sizeAtLevel, costAtLevel: number;
//   const asks = orderbook.getL2(1000);
//   for ([price, sizeAtLevel] of asks) {
//     costAtLevel = price * sizeAtLevel;
//     if (spentCost + costAtLevel > cost) {
//       break;
//     }
//     spentCost += costAtLevel;
//   }
//   if(price)let sendPrice = Math.min(price * 1.02, asks[0][0] * 1.05);
//   let formattedPrice;
//   if (tickSizeDecimals) {
//     formattedPrice = floorToDecimal(sendPrice, tickSizeDecimals);
//   } else {
//     formattedPrice = sendPrice;
//   }
//   return formattedPrice;
// }

export const getListOrders = async (pendingName: string) => {
  let crrMarket: any = {};
  MARKETS.forEach((item) => {
    if (item.name === pendingName) crrMarket = item;
  });
  if (!crrMarket || Object.keys(crrMarket).length === 0)
    alert('Invalid name input');
  let market = await Market.load(
    connection,
    crrMarket.address,
    undefined,
    crrMarket.programId,
  );

  let myOrders = await market.loadOrdersForOwner(
    connection,
    wallet.publicKey ||
    new PublicKey('63Z9RHLvodKaq1A4RpWadB3LNrb8SeD4PvdcfRuGpQDm'),
  );
};

export const cancelOrder = async (params: {
  market: Market;
  connection: Connection;
  wallet: Wallet;
  order: Order;
}) => {
  return cancelOrders({ ...params, orders: [params.order] });
};

export const cancelOrders = async ({
  market,
  wallet,
  connection,
  orders,
}: {
  market: Market;
  wallet: Wallet;
  connection: Connection;
  orders: Order[];
}) => {
  const transaction = market.makeMatchOrdersTransaction(5);
  orders.forEach((order) => {
    if (wallet.publicKey)
      transaction.add(
        market.makeCancelOrderInstruction(connection, wallet.publicKey, order),
      );
  });
  transaction.add(market.makeMatchOrdersTransaction(5));
  return await sendTransaction({
    transaction,
    wallet,
    connection,
    sendingMessage: 'Sending cancel...',
  });
};

export const getDoubleOrderTesting = async () => {
  const date = new Date();
  const utcFrom = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      11,
      0,
      0,
    ),
  );
  const utcTo = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      11,
      59,
      59,
    ),
  );

  const from = utcFrom.getTime() / 1000;
  const to = utcTo.getTime() / 1000;
  await axios
    .get(
      `https://event-history-api-candles.herokuapp.com/tv/history?symbol=SOL-USDT&resolution=1D&from=${from}&to=${to}`,
    )
    .then((res) => console.log(res.data));
  // await axios
  //   .get(`${Base_Url}/`)
  //   .then((res) => console.log(res.data))
  //   .catch((err) => console.log('err', err));
};
