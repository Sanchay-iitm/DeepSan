import { Client } from '@hiveio/dhive';

const client = new Client(['https://api.hive.blog', 'https://api.hivekings.com', 'https://anyx.io']);

export const getAccountHistory = async (username: string, from: number = -1, limit: number = 100) => {
  try {
    const history = await client.database.getAccountHistory(username, from, limit);
    return history;
  } catch (error) {
    console.error('Error fetching account history:', error);
    return [];
  }
};

export const getAccountInfo = async (username: string) => {
  try {
    const accounts = await client.database.getAccounts([username]);
    return accounts[0];
  } catch (error) {
    console.error('Error fetching account info:', error);
    return null;
  }
};

export const getRewardHistory = async (username: string) => {
  try {
    const history = await getAccountHistory(username);
    return history.filter((record: any) => 
      record[1].op[0] === 'claim_reward_balance' ||
      record[1].op[0] === 'author_reward' ||
      record[1].op[0] === 'curation_reward'
    );
  } catch (error) {
    console.error('Error fetching reward history:', error);
    return [];
  }
};

export const getDelegations = async (username: string) => {
  try {
    const delegations = await client.database.call('condenser_api.get_vesting_delegations', [username, '', 100]);
    return delegations;
  } catch (error) {
    console.error('Error fetching delegations:', error);
    return [];
  }
};

export const getFollowCount = async (username: string) => {
  try {
    const followCount = await client.database.call('condenser_api.get_follow_count', [username]);
    return followCount;
  } catch (error) {
    console.error('Error fetching follow count:', error);
    return null;
  }
};

export const getWalletHistory = async (username: string) => {
  try {
    const history = await getAccountHistory(username);
    return history.filter((record: any) => {
      const op = record[1].op[0];
      return op === 'transfer' || 
             op === 'claim_reward_balance' || 
             op === 'transfer_to_vesting' ||
             op === 'withdraw_vesting';
    });
  } catch (error) {
    console.error('Error fetching wallet history:', error);
    return [];
  }
};

export const calculateVotingPower = (account: any) => {
  if (!account) return 0;
  
  const secondsago = (new Date().getTime() - new Date(account.last_vote_time + "Z").getTime()) / 1000;
  let vpow = account.voting_power + (10000 * secondsago) / 432000;
  vpow = Math.min(vpow, 10000);
  return vpow / 100;
};

export const getEstimatedAccountValue = (account: any) => {
  if (!account) return { hive: 0, hbd: 0, total: 0 };
  
  const hiveBalance = parseFloat(account.balance.split(' ')[0]) || 0;
  const hbdBalance = parseFloat(account.hbd_balance.split(' ')[0]) || 0;
  const vestingShares = parseFloat(account.vesting_shares.split(' ')[0]) || 0;
  
  // This is a simplified calculation
  const estimatedTotal = hiveBalance + hbdBalance + (vestingShares * 0.5); // 0.5 is a rough conversion rate
  
  return {
    hive: hiveBalance,
    hbd: hbdBalance,
    total: estimatedTotal
  };
};