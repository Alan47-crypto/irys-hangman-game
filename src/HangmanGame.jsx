// src/HangmanGame.jsx
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import irynaMascot from './assets/iryna-mascot.png';

// ✅ use the shared helpers (they contain your deployed address + ABI)
import { getContract } from './lib/contract';

const wordList = [
  'ACCESSIBLE','ADDRESS','AGENTS','ARWEAVE','ASSET','AUTOMATION','BLOCK','BLOCKCHAIN','BYTES',
  'CAPTURE','COLLATERAL','COMPATIBLE','COMPUTATION','CONSENSUS','CONTENT','CONTRACT','CONTROL',
  'COPYRIGHT','CREATOR','CUSTOM','DATA','DATABASE','DATACHAIN','DATAPUNK','DATASET','DEMAND',
  'DEPLOYED','DURATION','ENFORCE','ETHEREUM','EXECUTION','EXTERNAL','FILECOIN','FRONTIER',
  'GATEKEEPER','HOLDER','HYBRID','INCENTIVE','INFERENCE','INFLATION','INTERACTION','INTERNET',
  'INVESTOR','IRYNA','LAYER','LEDGER','LEGACY','LICENSE','LICENSING','LOGIC','MARGIN','MARKET',
  'MINER','MINING','MOAT','MODEL','MODIFY','NETWORK','NODE','ONCHAIN','OPERATOR','ORACLE',
  'OWNERSHIP','PATENT','PERMANENT','PRICE','PROCESSING','PROGRAMMABLE','PROPERTY','PROTOCOL',
  'PROOF','PROVIDER','PUBLISH','RELIABILITY','REVENUE','REWARD','RULE','SCALABILITY','SECURITY',
  'SMART','SOLANA','SOLVENT','STAKE','STAKING','STORAGE','STORED','STRUCTURE','SUBMIT','SUPPLY',
  'SYSTEM','TERM','TERABYTE','TOKEN','TRANSACTION','USAGE','UTILITY','VALIDATION','VALIDATOR',
  'VALUE','VERIFIABLE','VOID','WEALTH'
];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const maxIncorrectGuesses = 6;
const IRYS_CHAIN_ID_DEC = 1270; // Irys Testnet (decimal)

// --------- Utils ---------
async function checkNetwork(provider) {
  if (!provider) return false;
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const network = await ethersProvider.getNetwork(); // chainId is bigint
    return Number(network.chainId) === IRYS_CHAIN_ID_DEC;
  } catch (err) {
    console.error('Failed to check network:', err);
    return false;
  }
}

export function HangmanGame({ provider }) {
  const [selectedWord, setSelectedWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);
  const [isWinner, setIsWinner] = useState(false);
  const [isLoser, setIsLoser] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [startTime, setStartTime] = useState(0);

  // tx UX
  const [txStatus, setTxStatus] = useState('idle'); // idle | pending | success | error
  const [txError, setTxError] = useState(null);
  const [pendingScoreData, setPendingScoreData] = useState(null);

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
    setTxError(null);
    setPendingScoreData(null);
    setStartTime(Date.now());
  };

  const handleGuess = (letter) => {
    if (isGameover || guessedLetters.includes(letter)) return;
    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);
    if (!selectedWord.includes(letter)) setIncorrectGuesses((prev) => prev + 1);
  };

  // --- Chain writes via contract helper ---
  const submitScore = async (word, points, solveTime) => {
    if (!provider) {
      setStatusText('Wallet not connected. Please connect your wallet.');
      setTxStatus('error');
      setPendingScoreData({ word, points, solveTime });
      return;
    }

    const onIrys = await checkNetwork(provider);
    if (!onIrys) {
      setStatusText('Wrong Network! Switch to Irys Testnet.');
      setTxStatus('error');
      setPendingScoreData({ word, points, solveTime });
      return;
    }

    setTxError(null);
    setTxStatus('pending');
    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const contract = getContract(signer); // ✅ uses shared address + ABI

      const tx = await contract.addScore(word, points, solveTime);
      setStatusText('Waiting for confirmation...');
      await tx.wait();

      setStatusText('✅ Score Saved On-Chain!');
      setTxStatus('success');
      setPendingScoreData(null);

      // notify leaderboard to reload
      window.dispatchEvent(new CustomEvent('irys:leaderboard:reload'));
    } catch (error) {
      console.error('Failed to add score:', error);
      setTxError(error?.reason || error?.message || String(error));
      setStatusText('Error saving score. Click Retry to try again.');
      setTxStatus('error');
      setPendingScoreData({ word, points, solveTime });
    }
  };

  const recordLoss = async () => {
    if (!provider) return;

    const onIrys = await checkNetwork(provider);
    if (!onIrys) {
      setStatusText('Wrong Network! Switch to Irys Testnet.');
      setTxStatus('error');
      return;
    }

    setTxError(null);
    try {
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const contract = getContract(signer);

      const tx = await contract.recordLoss();
      await tx.wait();

      // after streak reset, refresh leaderboard too
      window.dispatchEvent(new CustomEvent('irys:leaderboard:reload'));
    } catch (error) {
      console.error('Failed to record loss:', error);
      setTxError(error?.reason || error?.message || String(error));
    }
  };

  const retrySubmission = async () => {
    if (pendingScoreData) {
      const { word, points, solveTime } = pendingScoreData;
      await submitScore(word, points, solveTime);
    }
  };

  // --- Win/Lose detection ---
  useEffect(() => {
    if (!selectedWord || isWinner) return;
    const wordIsGuessed = selectedWord
      .split('')
      .every((letter) => guessedLetters.includes(letter));
    if (wordIsGuessed) setIsWinner(true);
  }, [guessedLetters, selectedWord, isWinner]);

  useEffect(() => {
    if (incorrectGuesses >= maxIncorrectGuesses) {
      setIsLoser(true);
      recordLoss();
    }
  }, [incorrectGuesses]); // provider not needed

  useEffect(() => {
    if (isWinner) {
      const endTime = Date.now();
      const solveTime = Math.round((endTime - startTime) / 1000);
      const basePoints = 10;
      const wordBonus = selectedWord.length * 2;
      const speedBonus = solveTime < 30 ? 5 : (solveTime < 60 ? 3 : 0);
      const penalty = incorrectGuesses * 2;
      const finalPoints = Math.max(0, basePoints + wordBonus + speedBonus - penalty);

      setStatusText('You Won! 🎉 Saving score to Leaderboard...');
      submitScore(selectedWord, finalPoints, solveTime);
    }
  }, [isWinner]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initializeGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="game-container">
      <div id="mascot-container">
        <img
          id="mascot-image"
          className={incorrectGuesses > 0 ? `stage-${incorrectGuesses}` : ''}
          src={irynaMascot}
          alt="Irys Mascot"
        />
      </div>

      <div
        className={`status-message ${
          txStatus === 'success' ? 'success' : ''
        } ${txStatus === 'error' ? 'error' : ''}`}
      >
        {isLoser && 'Game Over! 💀 Streak Reset.'}
        {isWinner && statusText}
        {!isGameover && `Guesses left: ${maxIncorrectGuesses - incorrectGuesses}`}
      </div>

      {txStatus === 'error' && txError && (
        <div className="tx-error">⚠️ {txError}</div>
      )}

      <div className="word-display">
        {selectedWord.split('').map((letter, index) => (
          <span key={index} className="letter">
            {guessedLetters.includes(letter) || isLoser ? letter : '_'}
          </span>
        ))}
      </div>

      <div className="keyboard">
        {alphabet.map((letter) => (
          <button
            key={letter}
            disabled={guessedLetters.includes(letter) || isGameover}
            onClick={() => handleGuess(letter)}
            className={
              guessedLetters.includes(letter)
                ? selectedWord.includes(letter)
                  ? 'correct'
                  : 'incorrect'
                : ''
            }
          >
            {letter}
          </button>
        ))}
      </div>

      {isGameover && (
        <div className="game-over-actions">
          <button className="reset-button" onClick={initializeGame}>
            Play Again
          </button>
          {txStatus === 'error' && pendingScoreData && (
            <button className="retry-button" onClick={retrySubmission}>
              Retry Submission
            </button>
          )}
        </div>
      )}
    </div>
  );
}
