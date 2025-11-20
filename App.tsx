import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { Button } from './components/Button';
import { GameState, Player } from './types';
import { generateMatchCommentary } from './services/geminiService';
import { ArrowDownCircle, ShieldAlert, Trophy, Play, RotateCcw, Info } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [matchResult, setMatchResult] = useState<{ players: Player[], duration: number } | null>(null);
  const [commentary, setCommentary] = useState<string>("");
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);

  const handleStartGame = () => {
    setGameState(GameState.PLAYING);
    setMatchResult(null);
    setCommentary("");
  };

  const handleGameOver = async (players: Player[], duration: number) => {
    setGameState(GameState.GAME_OVER);
    setMatchResult({ players, duration });
    
    // Trigger AI Commentary
    setIsLoadingCommentary(true);
    
    // Determine winner
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const loser = sortedPlayers[1];

    // If scores are super close (within 5), call it a draw?
    const isDraw = Math.abs(winner.score - loser.score) < 5;

    const comment = await generateMatchCommentary(
        isDraw ? null : winner, 
        isDraw ? null : loser, 
        Math.floor(duration)
    );
    
    setCommentary(comment);
    setIsLoadingCommentary(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 font-pixel mb-2 drop-shadow-lg">
            小朋友下樓梯
          </h1>
          <p className="text-slate-400 font-pixel text-xs md:text-sm">
            雙人對戰版 • 活下去！
          </p>
        </header>

        {gameState === GameState.MENU && (
          <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-center space-y-6 animate-fade-in-up">
             <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4 mb-8">
                    <div className="bg-slate-800 p-4 rounded-lg border border-blue-500/30">
                        <p className="text-blue-400 font-bold mb-2 font-pixel text-xs">玩家 1</p>
                        <div className="flex gap-2 justify-center">
                            <kbd className="px-2 py-1 bg-slate-700 rounded text-white font-mono text-sm border-b-2 border-slate-600">A</kbd>
                            <kbd className="px-2 py-1 bg-slate-700 rounded text-white font-mono text-sm border-b-2 border-slate-600">D</kbd>
                        </div>
                    </div>
                    <div className="text-slate-500 font-bold font-pixel">VS</div>
                    <div className="bg-slate-800 p-4 rounded-lg border border-red-500/30">
                        <p className="text-red-400 font-bold mb-2 font-pixel text-xs">玩家 2</p>
                        <div className="flex gap-2 justify-center">
                            <kbd className="px-2 py-1 bg-slate-700 rounded text-white font-mono text-sm border-b-2 border-slate-600">←</kbd>
                            <kbd className="px-2 py-1 bg-slate-700 rounded text-white font-mono text-sm border-b-2 border-slate-600"> →</kbd>
                        </div>
                    </div>
                </div>

                <div className="text-left space-y-2 text-sm text-slate-300 bg-slate-800/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <ArrowDownCircle className="w-4 h-4 text-green-400" />
                        <span>往下跳，不要被上方尖刺刺到</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span>小心陷阱與摔出畫面外</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span>看誰下得最深！</span>
                    </div>
                </div>
             </div>

             <Button onClick={handleStartGame} className="w-full py-4 text-lg flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> 開始遊戲
             </Button>
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <GameCanvas gameState={gameState} onGameOver={handleGameOver} />
        )}

        {gameState === GameState.GAME_OVER && matchResult && (
           <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-center space-y-6 animate-fade-in-up">
              <h2 className="text-3xl font-pixel text-white mb-4">遊戲結束</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {matchResult.players.map(p => (
                    <div key={p.id} className={`p-4 rounded-lg border-2 ${p.score === Math.max(...matchResult.players.map(pl=>pl.score)) ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-700 bg-slate-800'}`}>
                        <p className={`font-bold font-pixel text-sm mb-2 ${p.id === 1 ? 'text-blue-400' : 'text-red-400'}`}>
                            {p.name}
                        </p>
                        <p className="text-2xl text-white font-mono">{Math.floor(p.score)}層</p>
                        {p.lastDamageSource && (
                            <p className="text-xs text-slate-400 mt-2">死因: {p.lastDamageSource}</p>
                        )}
                    </div>
                ))}
              </div>

              {/* AI Commentary Section */}
              <div className="bg-black/40 rounded-lg p-4 border border-slate-700 text-left relative overflow-hidden min-h-[100px]">
                 <div className="flex items-center gap-2 mb-2 border-b border-slate-700 pb-2">
                    <Info className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">AI 賽評講評</span>
                 </div>
                 {isLoadingCommentary ? (
                    <div className="flex items-center justify-center h-16 space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                 ) : (
                    <p className="text-sm text-slate-300 italic leading-relaxed">
                        "{commentary}"
                    </p>
                 )}
              </div>

              <div className="flex gap-4">
                  <Button onClick={() => setGameState(GameState.MENU)} variant="secondary" className="flex-1">
                    回主選單
                  </Button>
                  <Button onClick={handleStartGame} className="flex-1 flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> 再玩一場
                  </Button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default App;