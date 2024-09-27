// src/components/TokenPricePredictor.js
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaChartLine, FaCoins, FaExchangeAlt, FaClock } from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LLAMA_API_BASE = '/api/llama'; // Using a proxy
const TOKENS = ['aave', 'uniswap', 'compound-governance-token', 'maker'];
const LLM_MODEL = 'llama';

const TokenPricePredictor = () => {
  const [tokenData, setTokenData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);

  const getRandomColor = useCallback(() => {
    return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
  }, []);

  const generatePredictions = useCallback(async (currentPrice, token) => {
    try {
      const response = await axios.post(`${LLAMA_API_BASE}/chat`, {
        model: LLM_MODEL,
        messages: [
          { role: "system", content: "You are a financial analyst specializing in cryptocurrency price predictions." },
          { role: "user", content: `Given the current price of ${token.toUpperCase()} is $${currentPrice}, predict the price for 1 hour, 6 hours, 12 hours, and 24 hours from now. Respond with only the four predicted prices, separated by commas.` }
        ]
      });

      const predictions = response.data.choices[0].message.content.split(',').map(price => parseFloat(price.trim()));
      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [1, 6, 12, 24].map(() => currentPrice * (1 + (Math.random() - 0.5) * 0.1));
    }
  }, []);

  const generateSentiment = useCallback(async (token) => {
    try {
      const response = await axios.post(`${LLAMA_API_BASE}/chat`, {
        model: LLM_MODEL,
        messages: [
          { role: "system", content: "You are a financial analyst specializing in cryptocurrency market sentiment." },
          { role: "user", content: `What is the current market sentiment for ${token.toUpperCase()}? Respond with only one word: Bearish, Neutral, or Bullish.` }
        ]
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating sentiment:', error);
      const sentiments = ['Bearish', 'Neutral', 'Bullish'];
      return sentiments[Math.floor(Math.random() * sentiments.length)];
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const newTokenData = {};
      for (const token of TOKENS) {
        const currentPrice = Math.random() * 1000 + 100; // Mock current price between 100 and 1100
        const predictions = await generatePredictions(currentPrice, token);
        const sentiment = await generateSentiment(token);

        newTokenData[token] = {
          currentPrice,
          predictions,
          sentiment
        };
      }

      setTokenData(newTokenData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data. Please try again later.');
      setLoading(false);
    }
  }, [generatePredictions, generateSentiment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartData = {
    labels: ['Now', '1h', '6h', '12h', '24h'],
    datasets: [{
      label: selectedToken.toUpperCase(),
      data: tokenData[selectedToken] ? [tokenData[selectedToken].currentPrice, ...tokenData[selectedToken].predictions] : [],
      fill: false,
      borderColor: getRandomColor(),
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: `${selectedToken.toUpperCase()} Price Prediction` },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: 'Price (USD)' }
      },
      x: {
        title: { display: true, text: 'Time' }
      }
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return 'text-green-600';
      case 'bearish': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">
        <FaChartLine className="inline-block mr-2" />
        TokenPulseAI: DeFi Token Price Predictor
      </h1>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaCoins className="mr-2" /> Current Token Prices
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TOKENS.map(token => (
                <div 
                  key={token} 
                  className={`bg-blue-50 p-4 rounded-lg cursor-pointer transition-all duration-300 ${selectedToken === token ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                  onClick={() => setSelectedToken(token)}
                >
                  <h3 className="text-lg font-semibold mb-1">{token.toUpperCase()}</h3>
                  <p className="text-2xl font-bold text-blue-600">${tokenData[token].currentPrice.toFixed(2)}</p>
                  <p className={`text-sm ${getSentimentColor(tokenData[token].sentiment)}`}>
                    Sentiment: {tokenData[token].sentiment}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaExchangeAlt className="mr-2" /> Price Forecast
            </h2>
            <div className="bg-gray-50 p-4 rounded-lg" style={{ height: '400px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <FaClock className="mr-2" /> Detailed Predictions for {selectedToken.toUpperCase()}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-gray-100 text-left">Time Frame</th>
                    <th className="px-4 py-2 bg-gray-100 text-left">Predicted Price</th>
                    <th className="px-4 py-2 bg-gray-100 text-left">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenData[selectedToken].predictions.map((price, index) => {
                    const change = ((price - tokenData[selectedToken].currentPrice) / tokenData[selectedToken].currentPrice) * 100;
                    return (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-2 font-semibold">{['1 hour', '6 hours', '12 hours', '24 hours'][index]}</td>
                        <td className="px-4 py-2 text-green-600 font-bold">${price.toFixed(2)}</td>
                        <td className={`px-4 py-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {change.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenPricePredictor;
