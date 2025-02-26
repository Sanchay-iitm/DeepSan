import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Activity, Users, Award, Calendar, TrendingUp, BarChart2, Wallet, Gift, Power, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  getAccountInfo, 
  getRewardHistory, 
  getDelegations, 
  getWalletHistory,
  calculateVotingPower,
  getEstimatedAccountValue
} from '../lib/hive';

export default function Dashboard() {
  const [username, setUsername] = useState('');
  const [accountData, setAccountData] = useState<any>(null);
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  const [delegations, setDelegations] = useState<any[]>([]);
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAccountData = async (searchUsername: string) => {
    setLoading(true);
    setError('');
    
    // Create an AbortController for the fetch requests
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Set a timeout to abort the request if it takes too long
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      // Use Promise.race to implement a timeout
      const accountInfo = await Promise.race([
        getAccountInfo(searchUsername),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);

      if (!accountInfo) {
        throw new Error('Account not found');
      }

      // Fetch all data in parallel for better performance
      const [rewards, userDelegations, transactions] = await Promise.all([
        getRewardHistory(searchUsername),
        getDelegations(searchUsername),
        getWalletHistory(searchUsername)
      ]);
      
      // Update all state at once to prevent multiple re-renders
      setAccountData(accountInfo);
      setRewardHistory(rewards);
      setDelegations(userDelegations);
      setWalletHistory(transactions);

      // Cache the results in localStorage for faster subsequent lookups
      localStorage.setItem(`hive_${searchUsername}`, JSON.stringify({
        accountInfo,
        rewards,
        delegations: userDelegations,
        transactions,
        timestamp: Date.now()
      }));

      await supabase.from('searches').insert({
        username: searchUsername,
        timestamp: new Date().toISOString(),
        account_data: accountInfo,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to fetch account data');
      setAccountData(null);
      setRewardHistory([]);
      setDelegations([]);
      setWalletHistory([]);
    } finally {
      setLoading(false);
      clearTimeout(timeout);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (username) {
      fetchAccountData(username);
    }
  };

  const StatCard = ({ icon: Icon, title, value, className = '' }: any) => (
    <div className={`glass-effect rounded-xl p-6 animate-fade-in ${className}`}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 rounded-lg">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  const TabButton = ({ name, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
        activeTab === name 
          ? 'bg-indigo-600 text-white' 
          : 'hover:bg-indigo-50 text-gray-600'
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  const renderContent = () => {
    if (!accountData) return null;

    const accountValue = getEstimatedAccountValue(accountData);
    const currentVotingPower = calculateVotingPower(accountData);

    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-effect rounded-xl p-6 animate-fade-in delay-500">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" />
                Account Statistics
              </h2>
              <dl className="grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm text-gray-500">Reputation</dt>
                  <dd className="text-lg font-medium">{accountData.reputation || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Balance</dt>
                  <dd className="text-lg font-medium">{accountData.balance || '0 HIVE'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Followers</dt>
                  <dd className="text-lg font-medium">{accountData.follower_count || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Following</dt>
                  <dd className="text-lg font-medium">{accountData.following_count || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            <div className="glass-effect rounded-xl p-6 animate-fade-in delay-600">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Power className="text-indigo-600" />
                Voting Power
              </h2>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                      Current Power
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-indigo-600">
                      {currentVotingPower.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-200">
                  <div
                    style={{ width: `${currentVotingPower}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'wallet':
        return (
          <div className="glass-effect rounded-xl p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Wallet className="text-indigo-600" />
              Wallet Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="text-sm text-gray-500">HIVE Balance</h3>
                <p className="text-2xl font-bold text-indigo-600">{accountValue.hive.toFixed(3)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="text-sm text-gray-500">HBD Balance</h3>
                <p className="text-2xl font-bold text-purple-600">{accountValue.hbd.toFixed(3)}</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="text-sm text-gray-500">Estimated Value</h3>
                <p className="text-2xl font-bold text-pink-600">${accountValue.total.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <div className="space-y-4">
                {walletHistory.slice(0, 5).map((tx: any, index: number) => (
                  <div key={index} className="p-4 bg-white rounded-lg shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{tx[1].op[0]}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx[1].timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {tx[1].op[1].amount || tx[1].op[1].reward || ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'delegations':
        return (
          <div className="glass-effect rounded-xl p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Share2 className="text-indigo-600" />
              Delegations
            </h2>
            <div className="space-y-4">
              {delegations.map((delegation: any, index: number) => (
                <div key={index} className="p-4 bg-white rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">To: {delegation.delegatee}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(delegation.min_delegation_time).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{delegation.vesting_shares}</p>
                  </div>
                </div>
              ))}
              {delegations.length === 0 && (
                <p className="text-center text-gray-500">No delegations found</p>
              )}
            </div>
          </div>
        );

      case 'rewards':
        return (
          <div className="glass-effect rounded-xl p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Gift className="text-indigo-600" />
              Reward History
            </h2>
            <div className="h-64 chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={rewardHistory.map((record: any, index: number) => ({
                    name: index,
                    reward: parseFloat(record[1].op[1].reward?.split(' ')[0] || 0)
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="reward" 
                    stroke="url(#colorReward)" 
                    strokeWidth={2}
                    dot={{ fill: '#6366f1' }}
                    activeDot={{ r: 6, fill: '#4f46e5' }}
                  />
                  <defs>
                    <linearGradient id="colorReward" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-bold text-gradient mb-4 animate-gradient-text">
            DeepSan Analytics
          </h1>
          <p className="text-gray-600 text-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Dive deep into Hive blockchain analytics with precision and clarity
          </p>
          <div className="mt-4 text-sm text-gray-500 developer-credit animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Developed with ❤️ by{' '}
            <span className="font-medium text-indigo-600">Deepak Singh</span> and{' '}
            <span className="font-medium text-purple-600">Sanchay Naresh Gupta</span>
          </div>
        </div>
        
        <form onSubmit={handleSearch} className="mb-12 animate-slide-in">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Hive username"
                className="w-full px-6 py-4 rounded-full border-2 border-indigo-100 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-lg transition-all duration-300 pr-40"
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2 transition-all duration-300"
              >
                <Search size={20} />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-center mt-4 animate-fade-in">{error}</p>
            )}
          </div>
        </form>

        {accountData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                icon={Users} 
                title="Account Name" 
                value={accountData.name}
                className="delay-100" 
              />
              <StatCard 
                icon={Activity} 
                title="Post Count" 
                value={accountData.post_count}
                className="delay-200" 
              />
              <StatCard 
                icon={Award} 
                title="Voting Power" 
                value={`${calculateVotingPower(accountData).toFixed(2)}%`}
                className="delay-300" 
              />
              <StatCard 
                icon={Calendar} 
                title="Created" 
                value={new Date(accountData.created).toLocaleDateString()}
                className="delay-400" 
              />
            </div>

            <div className="glass-effect rounded-xl p-4 mb-8">
              <div className="flex space-x-4 overflow-x-auto pb-2">
                <TabButton name="overview" icon={TrendingUp} label="Overview" />
                <TabButton name="wallet" icon={Wallet} label="Wallet" />
                <TabButton name="delegations" icon={Share2} label="Delegations" />
                <TabButton name="rewards" icon={Gift} label="Rewards" />
              </div>
            </div>

            {renderContent()}
          </>
        )}
      </div>
    </div>
  );
}