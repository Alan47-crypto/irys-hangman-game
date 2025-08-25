// src/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const contractAddress = '0x2110B34A15f0625CCC74289aeec33B1e1B6C6586';
const contractAbi = [{"type":"function","name":"addScore","inputs":[{"name":"_word","type":"string","internalType":"string"},{"name":"_points","type":"uint256","internalType":"uint256"},{"name":"_solveTime","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"allScores","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"player","type":"address","internalType":"address"},{"name":"word","type":"string","internalType":"string"},{"name":"points","type":"uint256","internalType":"uint256"},{"name":"solveTime","type":"uint256","internalType":"uint256"},{"name":"timestamp","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getScoreHistory","inputs":[],"outputs":[{"name":"","type":"tuple[]","internalType":"struct Leaderboard.Score[]","components":[{"name":"player","type":"address","internalType":"address"},{"name":"word","type":"string","internalType":"string"},{"name":"points","type":"uint256","internalType":"uint256"},{"name":"solveTime","type":"uint256","internalType":"uint256"},{"name":"timestamp","type":"uint256","internalType":"uint256"}]}],"stateMutability":"view"},{"type":"function","name":"recordLoss","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"totalScores","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"winStreaks","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"event","name":"NewScore","inputs":[{"name":"player","type":"address","indexed":true,"internalType":"address"},{"name":"word","type":"string","indexed":false,"internalType":"string"},{"name":"points","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"newTotalScore","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"newWinStreak","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"StreakBroken","inputs":[{"name":"player","type":"address","indexed":true,"internalType":"address"}],"anonymous":false}];

const truncateAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

export function Leaderboard({ provider }) {
  const [leaderboardData, setLeaderboardData] = useState([]); // This line is now correct
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessScores = async () => {
      if (!provider) return;
      setIsLoading(true);
      try {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const contract = new ethers.Contract(contractAddress, contractAbi, ethersProvider);
        const scoreHistory = await contract.getScoreHistory();
        
        const playerScores = new Map();
        for (const score of scoreHistory) {
          const player = score.player;
          const points = Number(score.points);
          if (playerScores.has(player)) {
            playerScores.set(player, playerScores.get(player) + points);
          } else {
            playerScores.set(player, points);
          }
        }
        
        const sortedLeaderboard = Array.from(playerScores, ([player, totalScore]) => ({ player, totalScore }))
                                       .sort((a, b) => b.totalScore - a.totalScore);

        const top10 = sortedLeaderboard.slice(0, 10);

        setLeaderboardData(top10);
      } catch (error) {
        console.error("Failed to fetch and process leaderboard:", error);
      }
      setIsLoading(false);
    };

    fetchAndProcessScores();

    const ethersProvider = new ethers.BrowserProvider(provider);
    const contract = new ethers.Contract(contractAddress, contractAbi, ethersProvider);
    const handleNewScore = () => {
        fetchAndProcessScores();
    };
    contract.on('NewScore', handleNewScore);
    contract.on('StreakBroken', handleNewScore);

    return () => {
      contract.off('NewScore', handleNewScore);
      contract.off('StreakBroken', handleNewScore);
    };
  }, [provider]);

  if (isLoading) {
    return (
        <div className="leaderboard-container">
            <h2>Top 10 Players</h2>
            <p>Loading Scores...</p>
        </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <h2>Top 10 Players</h2>
      {leaderboardData && leaderboardData.length > 0 ? (
        <table>
          <thead><tr><th>Rank</th><th>Player</th><th>Total Score</th></tr></thead>
          <tbody>
            {leaderboardData.map((data, index) => (
              <tr key={data.player}>
                <td>{index + 1}</td>
                <td>{truncateAddress(data.player)}</td>
                <td>{data.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No scores yet. Be the first!</p>
      )}
    </div>
  );
}