import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  RouteProps,
} from 'react-router-dom';
import './App.css';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import store from './store/store';
import routes from './routes/routes';
import i18n from './i18n/i18next';
import { connectWallet, getTokenAccount, getOrderTesting, getListOrders } from './util';

const App = () => {
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    i18n.changeLanguage(e.target.value);

  const handleConnectWallet = () => {
    connectWallet();
  }

  const handleGetTokenAccount = () => {
    getTokenAccount();
  }

  const [name, setName] = useState<string>('');
  const [side, setSide] = useState<string>('buy');
  const [price, setPrice] = useState<number>();
  const [size, setSize] = useState<number>();
  const [pendingName, setPendingName] = useState<string>('');

  const handleAddTokenAccount = () => {
    // addTokenAccount({
    //   mintAddress: "2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk",
    //   tokenName: 'Wrapped Ethereum (Sollet)',
    //   tokenSymbol: 'soETH'
    // });
  }

  const handleOrderTesting = () => {
    const trade = {
      name: name,
      side: side,
      price: price,
      size: size
    }
    getOrderTesting(trade);
  }

  const handleListPendingOrders = () => {
    getListOrders(pendingName);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1>Testing Sollet Wallet</h1>
      <button onClick={handleConnectWallet}>Connect to the Wallet</button>
      <button onClick={handleGetTokenAccount} >GetTokenAccount</button>
      <button onClick={handleAddTokenAccount}>AddTokenAccount</button>
      <div>
        <label>Pair Name</label>
        <input value={name} onChange={(e) => { setName(e.target.value) }}></input>
        <label>Side</label>
        <select defaultValue='buy' onChange={(e) => { setSide(e.target.value) }}>
          <option>buy</option>
          <option>sell</option>
        </select>
        <label>Price</label>
        <input value={price} onChange={(e) => { setPrice(Number(e.target.value)) }} type='number'></input>
        <label>Size</label>
        <input value={size} onChange={(e) => { setSize(Number(e.target.value)) }} type='number'></input>
      </div>
      <button onClick={handleOrderTesting}>Order Testing</button>
      <input value={pendingName} onChange={(e) => {
        setPendingName(e.target.value)
      }} />
      <button onClick={handleListPendingOrders}>Order Lists</button>
    </div>
  );
};

export default App;
