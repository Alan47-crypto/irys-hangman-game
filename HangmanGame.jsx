// src/HangmanGame.jsx
import { useState, useEffect } from 'react';
import { useWriteContract } from 'wagmi'; // Import the hook for writing to contracts
import { BrowserProvider } from 'ethers';

// You'll need the contract address and ABI here as well
const contractAddress = 'YOUR_DEPLOYED_CONTRACT_ADDRESS'; // Paste your address again
const contractAbi = [/* PASTE YOUR ABI ARRAY AGAIN */];

const wordList = [ 'ACCESSIBLE', 'ADDRESS', 'AGENTS', 'ARWEAVE', 'ASSET', 'AUTOMATION', 'BLOCK', 'BLOCKCHAIN', 'BYTES', 'CAPTURE', 'COLLATERAL', 'COMPATIBLE', 'COMPUTATION', 'CONSENSUS', 'CONTENT', 'CONTRACT', 'CONTROL', 'COPYRIGHT', 'CREATOR', 'CUSTOM', 'DATA', 'DATABASE', 'DATACHAIN', 'DATAPUNK', 'DATASET', 'DEMAND', 'DEPLOYED', 'DURATION', 'ENFORCE', 'ETHEREUM', 'EXECUTION', 'EXTERNAL', 'FILECOIN', 'FRONTIER', 'GATEKEEPER', 'HOLDER', 'HYBRID', 'INCENTIVE', 'INFERENCE', 'INFLATION', 'INTERACTION', 'INTERNET', 'INVESTOR', 'IRYNA', 'LAYER', 'LEDGER', 'LEGACY', 'LICENSE', 'LICENSING', 'LOGIC', 'MARGIN', 'MARKET', 'MINER', 'MINING', 'MOAT', 'MODEL', 'MODIFY', 'NETWORK', 'NODE', 'ONCHAIN', 'OPERATOR', 'ORACLE', 'OWNERSHIP', 'PATENT', 'PERMANENT', 'PRICE', 'PROCESSING', 'PROGRAMMABLE', 'PROPERTY', 'PROTOCOL', 'PROOF', 'PROVIDER', 'PUBLISH', 'RELIABILITY', 'REVENUE', 'REWARD', 'RULE', 'SCALABILITY', 'SECURITY', 'SMART', 'SOLANA', 'SOLVENT', 'STAKE', 'STAKING', 'STORAGE', 'STORED', 'STRUCTURE', 'SUBMIT', 'SUPPLY', 'SYSTEM', 'TERM', 'TERABYTE', 'TOKEN', 'TRANSACTION', 'USAGE', 'UTILITY', 'VALIDATION', 'VALIDATOR', 'VALUE', 'VERIFIABLE', 'VOID', 'WEALTH' ];
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const maxIncorrectGuesses = 6;

export function HangmanGame() {
  // Wagmi hook to call the `addScore` function
  const { writeContract, isPending, isSuccess, isError, error } = useWriteContract();

  // All the existing game state
  const [selectedWord, setSelectedWord] = useState('');
  // ... rest of the state variables
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [incorrectGuesses, setIncorrectGuesses] = useState(0);
  const [isWinner, setIsWinner] = useState(false);
  const [isLoser, setIsLoser] = useState(false);
  const [statusText, setStatusText] = useState('');

  const isGameover = isWinner || isLoser;

  const initializeGame = () => {
    const newWord = wordList[Math.floor(Math.random() * wordList.length)];
    setSelectedWord(newWord);
    // ... reset other states
    setGuessedLetters([]);
    setIncorrectGuesses(0);
    setIsWinner(false);
    setIsLoser(false);
    setStatusText('');
  };

  const handleGuess = (letter) => {
    if (isGameover || guessedLetters.includes(letter)) return;
    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);
    if (!selectedWord.includes(letter)) setIncorrectGuesses(prev => prev + 1);
  };

  // useEffect hooks for checking win/loss
  useEffect(() => {
    if (!selectedWord || isWinner) return;
    const wordIsGuessed = selectedWord.split('').every(letter => guessedLetters.includes(letter));
    if (wordIsGuessed) setIsWinner(true);
  }, [guessedLetters, selectedWord, isWinner]);

  useEffect(() => {
    if (incorrectGuesses >= maxIncorrectGuesses) setIsLoser(true);
  }, [incorrectGuesses]);

  // useEffect hook to call the smart contract on win
  useEffect(() => {
    if (isWinner) {
      setStatusText('You won! Saving score to the blockchain...');
      writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'addScore',
        args: [selectedWord, incorrectGuesses],
      });
    }
  }, [isWinner]);

  useEffect(() => {
    initializeGame();
  }, []);

  return (
    <div className="game-container">
      {/* Mascot and Word Display... */}
        <div id="mascot-container">
            <img id="mascot-image" className={incorrectGuesses > 0 ? `stage-${incorrectGuesses}` : ''} src="https://assets.coingecko.com/characters/iryna/small.png?1719225727" alt="Irys Mascot" />
        </div>
        <div className="status-message">
            {isLoser && "Game Over! 💀"}
            {isWinner && (isPending ? "Waiting for transaction..." : (isSuccess ? "Score Saved!" : (isError ? "Transaction Failed" : statusText)))}
            {!isGameover && `Guesses left: ${maxIncorrectGuesses - incorrectGuesses}`}
        </div>
        <div className="word-display">
            {selectedWord.split('').map((letter, index) => <span key={index} className="letter">{guessedLetters.includes(letter) || isLoser ? letter : '_'}</span>)}
        </div>

      {/* Keyboard */}
      <div className="keyboard">
        {alphabet.map(letter => <button key={letter} disabled={guessedLetters.includes(letter) || isGameover} onClick={() => handleGuess(letter)} className={guessedLetters.includes(letter) ? (selectedWord.includes(letter) ? 'correct' : 'incorrect') : ''}>{letter}</button>)}
      </div>

      {/* Play Again button */}
      {isGameover && <button className="reset-button" onClick={initializeGame}>Play Again</button>}
    </div>
  );
}
