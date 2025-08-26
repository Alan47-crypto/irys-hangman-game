// src/HangmanGame.jsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import irynaMascot from './assets/iryna-mascot.png'; // <-- 1. Import the local image

const contractAddress = '0x2110B34A15f0625CCC74289aeec33B1e1B6C6586';
const contractAbi = [{"type":"function","name":"addScore","inputs":[{"name":"_word","type":"string","internalType":"string"},{"name":"_points","type":"uint256","internalType":"uint256"},{"name":"_solveTime","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"allScores","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"player","type":"address","internalType":"address"},{"name":"word","type":"string","internalType":"string"},{"name":"points","type":"uint256","internalType":"uint256"},{"name":"solveTime","type":"uint256","internalType":"uint256"},{"name":"timestamp","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getScoreHistory","inputs":[],"outputs":[{"name":"","type":"tuple[]","internalType":"struct Leaderboard.Score[]","components":[{"name":"player","type":"address","internalType":"address"},{"name":"word","type":"string","internalType":"string"},{"name":"points","type":"uint256","internalType":"uint256"},{"name":"solveTime","type":"uint256","internalType":"uint256"},{"name":"timestamp","type":"uint256","internalType":"uint256"}]}],"stateMutability":"view"},{"type":"function","name":"recordLoss","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"totalScores","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"winStreaks","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"event","name":"NewScore","inputs":[{"name":"player","type":"address","indexed":true,"internalType":"address"},{"name":"word","type":"string","indexed":false,"internalType":"string"},{"name":"points","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"newTotalScore","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"newWinStreak","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"StreakBroken","inputs":[{"name":"player","type":"address","indexed":true,"internalType":"address"}],"anonymous":false}];

const wordList = [ 'ACCESSIBLE', 'ADDRESS', 'AGENTS', 'ARWEAVE', 'ASSET', 'AUTOMATION', 'BLOCK', 'BLOCKCHAIN', 'BYTES', 'CAPTURE', 'COLLATERAL', 'COMPATIBLE', 'COMPUTATION', 'CONSENSUS', 'CONTENT', 'CONTRACT', 'CONTROL', 'COPYRIGHT', 'CREATOR', 'CUSTOM', 'DATA', 'DATABASE', 'DATACHAIN', 'DATAPUNK', 'DATASET', 'DEMAND', 'DEPLOYED', 'DURATION', 'ENFORCE', 'ETHEREUM', 'EXECUTION', 'EXTERNAL', 'FILECOIN', 'FRONTIER', 'GATEKEEPER', 'HOLDER', 'HYBRID', 'INCENTIVE', 'INFERENCE', 'INFLATION', 'INTERACTION', 'INTERNET', 'INVESTOR', 'IRYNA', 'LAYER', 'LEDGER', 'LEGACY', 'LICENSE', 'LICENSING', 'LOGIC', 'MARGIN', 'MARKET', 'MINER', 'MINING', 'MOAT', 'MODEL', 'MODIFY', 'NETWORK', 'NODE', 'ONCHAIN', 'OPERATOR', 'ORACLE', 'OWNERSHIP', 'PATENT', 'PERMANENT', 'PRICE', 'PROCESSING', 'PROGRAMMABLE', 'PROPERTY', 'PROTOCOL', 'PROOF', 'PROVIDER', 'PUBLISH', 'RELIABILITY', 'REVENUE', 'REWARD', 'RULE', 'SCALABILITY', 'SECURITY', 'SMART', 'SOLANA', 'SOLVENT', 'STAKE', 'STAKING', 'STORAGE', 'STORED', 'STRUCTURE', 'SUBMIT', 'SUPPLY', 'SYSTEM', 'TERM', 'TERABYTE', 'TOKEN', 'TRANSACTION', 'USAGE', 'UTILITY', 'VALIDATION', 'VALIDATOR', 'VALUE', 'VERIFIABLE', 'VOID', 'WEALTH' ];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const maxIncorrectGuesses = 6;

export function HangmanGame({ provider }) {
  const [selectedWord, setSelectedWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);
  const [isWinner, setIsWinner] = useState(false);
  const [isLoser, setIsLoser] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [txStatus, setTxStatus] = useState('idle');

  const isGameover = isWinner || isLoser;

  const initializeGame = () => {
    const newWord = wordList[Math.floor(Math.random() * wordList.length)];
    setSelectedWord(newWord);
    setGuessedLetters([]);
    setIncorrectGuesses(0);
    setIsWinner(false);
    setIsLoser(false);
    setStatusText('');
    setTxStatus('idle');
    setStartTime(Date.now());
  };

  const handleGuess = (letter) => {
    if (isGameover || guessedLetters.includes(letter)) return;
    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);
    if (!selectedWord.includes(letter)) setIncorrectGuesses(prev => prev + 1);
  };

  useEffect(() => {
    if (!selectedWord || isWinner) return;
    const wordIsGuessed = selectedWord.split('').every(letter => guessedLetters.includes(letter));
    if (wordIsGuessed) setIsWinner(true);
  }, [guessedLetters, selectedWord, isWinner]);

  useEffect(() => {
    const recordLossOnContract = async () => {
        if (!provider) return;
        try {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const contract = new ethers.Contract(contractAddress, contractAbi, signer);
            const tx = await contract.recordLoss();
            await tx.wait();
            console.log("Loss recorded, win streak reset.");
        } catch (error) {
            console.error("Failed to record loss:", error);
        }
    };

    if (incorrectGuesses >= maxIncorrectGuesses) {
      setIsLoser(true);
      recordLossOnContract();
    }
  }, [incorrectGuesses, provider]);

  useEffect(() => {
    const addScoreToContract = async () => {
      if (!provider) return;
      const endTime = Date.now();
      const solveTime = Math.round((endTime - startTime) / 1000);
      const basePoints = 10;
      const wordBonus = selectedWord.length * 2;
      const speedBonus = solveTime < 30 ? 5 : (solveTime < 60 ? 3 : 0);
      const penalty = incorrectGuesses * 2;
      const finalPoints = basePoints + wordBonus + speedBonus - penalty;

      setStatusText("You Won! 🎉 Saving score to Leaderboard...");
      setTxStatus('pending');
      try {
        const ethersProvider = new ethers.BrowserProvider(provider);
          const network = await ethersProvider.getNetwork();
        if (network.chainId !== 1270) {
            setStatusText("Wrong Network! Switch to Irys Testnet.");
            setTxStatus('error');
            return; // Stop the function if on the wrong network
        }
        const signer = await ethersProvider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractAbi, signer);
        const tx = await contract.addScore(selectedWord, finalPoints, solveTime);
        setStatusText("Waiting for confirmation...");
        await tx.wait();
        setStatusText("✅ Score Saved On-Chain!");
        setTxStatus('success');
      } catch (error) {
        console.error("Failed to add score:", error);
        setStatusText("Error saving score.");
        setTxStatus('error');
      }
    };
    if (isWinner) addScoreToContract();
  }, [isWinner, provider, incorrectGuesses, selectedWord, startTime]);

  useEffect(() => { initializeGame(); }, []);

  return (
    <div className="game-container">
      <div id="mascot-container">
        {/* 2. Use the imported image variable */}
        <img id="mascot-image" className={incorrectGuesses > 0 ? `stage-${incorrectGuesses}` : ''} src={irynaMascot} alt="Irys Mascot" />
      </div>
      <div className={`status-message ${txStatus === 'success' ? 'success' : ''}`}>
        {isLoser && "Game Over! 💀 Streak Reset."}
        {isWinner && statusText}
        {!isGameover && `Guesses left: ${maxIncorrectGuesses - incorrectGuesses}`}
      </div>
      <div className="word-display">
        {selectedWord.split('').map((letter, index) => <span key={index} className="letter">{guessedLetters.includes(letter) || isLoser ? letter : '_'}</span>)}
      </div>
      <div className="keyboard">
        {alphabet.map(letter => <button key={letter} disabled={guessedLetters.includes(letter) || isGameover} onClick={() => handleGuess(letter)} className={guessedLetters.includes(letter) ? (selectedWord.includes(letter) ? 'correct' : 'incorrect') : ''}>{letter}</button>)}
      </div>
      {isGameover && <button className="reset-button" onClick={initializeGame}>Play Again</button>}
    </div>
  );
}