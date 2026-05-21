import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, RotateCcw, Clock, Move } from 'lucide-react';

const GRID_SIZE = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

// 正解の配列を生成 [1, 2, 3, ..., 15, 0] (0は空のマス)
const getSolvedBoard = () => {
  const board = Array.from({ length: TOTAL_TILES - 1 }, (_, i) => i + 1);
  board.push(0);
  return board;
};

// 指定したインデックスの隣接するマスのインデックスを取得
const getNeighbors = (index) => {
  const row = Math.floor(index / GRID_SIZE);
  const col = index % GRID_SIZE;
  const neighbors = [];

  if (row > 0) neighbors.push(index - GRID_SIZE); // 上
  if (row < GRID_SIZE - 1) neighbors.push(index + GRID_SIZE); // 下
  if (col > 0) neighbors.push(index - 1); // 左
  if (col < GRID_SIZE - 1) neighbors.push(index + 1); // 右

  return neighbors;
};

// 盤面をシャッフルする（必ずクリア可能な配置にするため、正解から逆算して動かす）
const shuffleBoard = () => {
  let board = getSolvedBoard();
  let emptyIndex = TOTAL_TILES - 1;

  // 150回ランダムに動かしてシャッフル
  for (let i = 0; i < 150; i++) {
    const neighbors = getNeighbors(emptyIndex);
    const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
    
    // スワップ
    [board[emptyIndex], board[randomNeighbor]] = [board[randomNeighbor], board[emptyIndex]];
    emptyIndex = randomNeighbor;
  }
  
  return board;
};

const App = () => {
  const [board, setBoard] = useState([]);
  const [isWon, setIsWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 初期化
  useEffect(() => {
    startNewGame();
  }, []);

  // タイマー
  useEffect(() => {
    let interval;
    if (isPlaying && !isWon) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isWon]);

  const startNewGame = () => {
    setBoard(shuffleBoard());
    setMoves(0);
    setTime(0);
    setIsWon(false);
    setIsPlaying(true);
  };

  const checkWin = (currentBoard) => {
    const solved = getSolvedBoard();
    return currentBoard.every((val, index) => val === solved[index]);
  };

  const handleTileClick = (index) => {
    if (!isPlaying || isWon) return;

    const emptyIndex = board.indexOf(0);
    const neighbors = getNeighbors(emptyIndex);

    // クリックしたタイルが空マスの隣なら移動
    if (neighbors.includes(index)) {
      const newBoard = [...board];
      [newBoard[index], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[index]];
      
      setBoard(newBoard);
      setMoves((m) => m + 1);

      if (checkWin(newBoard)) {
        setIsWon(true);
        setIsPlaying(false);
      }
    }
  };

  // 時間のフォーマット (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-6">
        
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">15パズル</h1>
          <p className="text-slate-500 text-sm">タイルをスライドさせて1〜15の順に並べよう</p>
        </div>

        {/* ステータスバー */}
        <div className="flex justify-between items-center bg-slate-50 rounded-xl p-4 mb-6 shadow-inner">
          <div className="flex items-center space-x-2">
            <Move className="w-5 h-5 text-indigo-500" />
            <span className="font-semibold">{moves} 手</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold">{formatTime(time)}</span>
          </div>
        </div>

        {/* パズルボード */}
        <div className="relative aspect-square bg-slate-800 rounded-xl p-3 mb-6 shadow-inner">
          <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full h-full">
            {board.map((tileNumber, index) => {
              const isEmpty = tileNumber === 0;
              const isCorrect = tileNumber === index + 1; // 正しい位置にあるか
              
              // ブロックの色と立体感を決定
              const getBlockClasses = (num, correct) => {
                const colorSets = [
                  'bg-red-500 border-red-700 text-white',      // 1行目
                  'bg-blue-500 border-blue-700 text-white',     // 2行目
                  'bg-green-500 border-green-700 text-white',   // 3行目
                  'bg-yellow-400 border-yellow-600 text-slate-900' // 4行目
                ];
                const rowIndex = Math.floor((num - 1) / 4);
                const baseColor = colorSets[rowIndex];
                
                // 正解時は内側に白いリングを付けてハイライト
                return `${baseColor} ${correct ? 'ring-4 ring-white/70 ring-inset brightness-110' : ''}`;
              };

              return (
                <button
                  key={`tile-${index}`}
                  onClick={() => handleTileClick(index)}
                  disabled={isEmpty || isWon}
                  className={`
                    relative flex items-center justify-center text-3xl font-black rounded-lg
                    transition-all duration-100 ease-in-out
                    ${isEmpty 
                      ? 'opacity-0 cursor-default' 
                      : `shadow-lg border-b-[6px] active:border-b-0 active:translate-y-[6px] cursor-pointer ${getBlockClasses(tileNumber, isCorrect)}`
                    }
                  `}
                >
                  {!isEmpty && tileNumber}
                </button>
              );
            })}
          </div>

          {/* クリア時のオーバーレイ */}
          {isWon && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 animate-in fade-in duration-500">
              <div className="bg-indigo-500 text-white p-4 rounded-full mb-4 shadow-lg shadow-indigo-500/40">
                <Trophy className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">クリア！</h2>
              <p className="text-slate-600 font-medium">
                タイム: {formatTime(time)} / 手数: {moves}手
              </p>
            </div>
          )}
        </div>

        {/* コントロール */}
        <button
          onClick={startNewGame}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-colors active:scale-[0.98] shadow-md shadow-indigo-600/20"
        >
          <RotateCcw className="w-5 h-5" />
          <span>最初からやり直す</span>
        </button>

      </div>
    </div>
  );
};

export default App;
