
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Eye, Info, Share2, Star, AlertCircle, Loader2, Music, Check, X } from 'lucide-react';
import { AUDIO_URL, PROFESSIONAL_STRUCTURE, BUTTON_CONFIG, SectionType } from './constants';
import { formatTime, playFeedbackSound } from './utils';

interface UserGuess {
  sectionIndex: number;
  type: SectionType;
  isCorrect: boolean;
}

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [guesses, setGuesses] = useState<UserGuess[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [shakeButton, setShakeButton] = useState<SectionType | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const handlePlayPause = async () => {
    initAudio();
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      setLoadError("音频播放失败，请刷新页面。");
      setIsPlaying(false);
    }
  };

  const handleRestart = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.currentTime = 0;
      await audio.play();
      setIsPlaying(true);
      setGuesses([]);
      setIsGameOver(false);
      setShowResults(false);
    } catch (err) {}
  };

  const handleDetect = (type: SectionType) => {
    if (!isPlaying && !isGameOver) return;
    initAudio();

    // 确定当前播放时间属于哪一个预设段落
    const sectionIndex = PROFESSIONAL_STRUCTURE.findIndex(s => 
      currentTime >= s.start && currentTime < (s.end > duration ? duration : s.end)
    );
    
    if (sectionIndex === -1) return;

    // 检查该段落是否已被标记过
    const alreadyGuessed = guesses.some(g => g.sectionIndex === sectionIndex);
    if (alreadyGuessed) return;

    const actualType = PROFESSIONAL_STRUCTURE[sectionIndex].type;
    const isCorrect = actualType === type;

    if (isCorrect) {
      playFeedbackSound(audioContextRef.current);
    } else {
      setShakeButton(type);
      setTimeout(() => setShakeButton(null), 500);
    }

    setGuesses(prev => [...prev, { sectionIndex, type, isCorrect }]);
  };

  const calculateScore = () => {
    const correctCount = guesses.filter(g => g.isCorrect).length;
    const total = PROFESSIONAL_STRUCTURE.length;
    const score = (correctCount / total) * 5;
    return Math.max(1, Math.round(score));
  };

  const handleFinish = () => {
    setIsGameOver(true);
    setShowResults(true);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => { setDuration(audio.duration); setIsLoading(false); };
    const handleEnded = () => { setIsPlaying(false); handleFinish(); };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', () => setLoadError("音频加载失败"));
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="text-center mb-10 max-w-2xl w-full">
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tighter flex items-center justify-center gap-3">
          <span className="text-cyan-400">DETECTIVE:</span> RONDO
        </h1>
        <div className="inline-block px-4 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-mono text-gray-500 uppercase tracking-widest">
          Mozart: Turkish March
        </div>
      </header>

      {/* Tutorial */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-6 backdrop-blur-xl">
          <div className="bg-[#16162d] p-8 md:p-10 rounded-[2.5rem] max-w-xl w-full border border-white/10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-10 h-10 text-cyan-400" />
            </div>
            <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter">曲式身份识别任务</h3>
            <p className="text-gray-400 mb-8 leading-relaxed">
              指挥家将整首曲子划分为 7 个逻辑段落。<br/>
              你的任务是：根据听到的旋律情绪、调性和织体，<br/>
              为每个出现的段落匹配正确的“身份标签”。
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {BUTTON_CONFIG.map(b => (
                <div key={b.type} className={`${b.color} p-3 rounded-xl text-left border border-white/10`}>
                  <div className="font-bold text-sm">{b.label}</div>
                  <div className="text-[10px] opacity-70">{b.desc}</div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => { setShowTutorial(false); initAudio(); }}
              className="w-full py-5 bg-cyan-500 text-[#0a0a1a] font-black rounded-2xl hover:bg-cyan-400 transition-all transform active:scale-95 uppercase tracking-widest"
            >
              立刻开始
            </button>
          </div>
        </div>
      )}

      <main className="w-full max-w-5xl space-y-12">
        {loadError && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-200">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* The Segmented Timeline */}
        <section className="bg-white/5 p-8 rounded-[3rem] border border-white/10 shadow-inner relative">
          <div className="mb-6">
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.3em] mb-4 text-center">曲式侦察轨 (身份隐藏)</p>
            <div className="h-24 w-full bg-black/40 rounded-3xl flex relative overflow-hidden border border-white/5 p-1">
              {PROFESSIONAL_STRUCTURE.map((section, idx) => {
                const guess = guesses.find(g => g.sectionIndex === idx);
                const isCurrent = currentTime >= section.start && currentTime < (section.end > duration ? duration : section.end);
                
                return (
                  <div 
                    key={idx}
                    className={`relative h-full transition-all duration-300 border-r border-white/5 flex flex-col items-center justify-center
                      ${isCurrent ? 'ring-2 ring-inset ring-cyan-500/50 scale-[1.02] z-10' : ''}
                    `}
                    style={{ width: `${(( (section.end > duration ? duration : section.end) - section.start) / duration) * 100}%` }}
                  >
                    {/* Visual Segment Base (Always visible as a placeholder) */}
                    <div className={`absolute inset-0 transition-all duration-500
                      ${guess ? (guess.isCorrect ? section.color + ' opacity-70' : 'bg-red-900 opacity-70') : 'bg-white/10 opacity-70'}
                    `} />
                    
                    {/* Status Content */}
                    <div className="relative z-10">
                      {guess ? (
                        guess.isCorrect ? (
                          <div className="flex flex-col items-center animate-bounce-in">
                            <span className="text-3xl font-black">{guess.type}</span>
                            <Check className="w-4 h-4 text-white/50" />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-red-300">
                            <span className="text-xl font-black opacity-50">{guess.type}</span>
                            <X className="w-4 h-4" />
                          </div>
                        )
                      ) : (
                        <div className={`text-white/20 font-black text-xl ${isCurrent ? 'animate-pulse' : ''}`}>?</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Playhead */}
            <div 
              className="absolute top-8 bottom-8 w-[2px] bg-cyan-400 z-20 pointer-events-none transition-all duration-100 ease-linear shadow-[0_0_20px_rgba(78,205,196,1)]"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full" />
            </div>
          </div>

          <div className="flex justify-between items-center px-4 font-mono text-[10px] text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <div className="flex gap-1.5">
              {PROFESSIONAL_STRUCTURE.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${guesses.find(g => g.sectionIndex === i)?.isCorrect ? 'bg-cyan-400' : 'bg-white/10'}`} />
              ))}
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        </section>

        {/* Detective Controls */}
        <section className="space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {BUTTON_CONFIG.map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleDetect(btn.type)}
                disabled={isGameOver || !isPlaying}
                className={`
                  relative overflow-hidden group p-6 rounded-[2rem] transition-all transform active:scale-95 disabled:opacity-50 disabled:grayscale
                  ${btn.color} hover:brightness-110 shadow-2xl border border-white/10
                  ${shakeButton === btn.type ? 'animate-shake' : ''}
                `}
              >
                <div className="relative z-10 text-center">
                  <div className="text-4xl font-black mb-1">{btn.type}</div>
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">{btn.desc}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-8">
            <button onClick={handlePlayPause} className="p-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group active:scale-90">
              {isLoading && !isPlaying ? <Loader2 className="w-10 h-10 animate-spin text-cyan-400" /> : isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current translate-x-1" />}
            </button>
            
            <div className="h-12 w-[1px] bg-white/10" />

            <button onClick={handleRestart} className="p-4 rounded-xl text-gray-600 hover:text-white transition-colors">
              <RotateCcw className="w-7 h-7" />
            </button>

            {!isGameOver && (
              <button 
                onClick={handleFinish}
                className="px-8 py-4 rounded-2xl border border-white/20 text-gray-400 font-black hover:text-cyan-400 hover:border-cyan-400/50 transition-all uppercase tracking-widest text-xs"
              >
                结束侦查
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Results Modal */}
      {showResults && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/98 p-4 overflow-y-auto backdrop-blur-2xl">
          <div className="bg-[#1e1e3f] rounded-[3.5rem] p-10 md:p-14 max-w-3xl w-full border border-white/10 shadow-2xl">
            <div className="text-center mb-10">
              <div className="text-cyan-400 font-bold tracking-[0.4em] mb-4 uppercase text-xs">Mission Over</div>
              <h2 className="text-6xl font-black mb-8 tracking-tighter">分析总结</h2>
              <div className="flex justify-center gap-3 mb-10">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-14 h-14 ${i < calculateScore() ? 'text-yellow-400 fill-current drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]' : 'text-white/5'}`} 
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 text-center">
                <div className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">正确匹配</div>
                <div className="text-5xl font-black text-cyan-400">
                  {guesses.filter(g => g.isCorrect).length}<span className="text-xl text-gray-600">/7</span>
                </div>
              </div>
              <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 text-center">
                <div className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">错误尝试</div>
                <div className="text-5xl font-black text-red-500">{guesses.filter(g => !g.isCorrect).length}</div>
              </div>
            </div>

            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 mb-10">
              <h4 className="font-black text-xl text-white mb-6 flex items-center gap-3">
                <Music className="w-6 h-6 text-cyan-400" /> 专业曲式档案
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed opacity-80">
                <div className="space-y-2">
                  <p><strong className="text-yellow-500">A 段 (a小调)</strong>: 轻快而略带忧郁的“主部主题”，它是全曲的核心，出现了两次。</p>
                  <p><strong className="text-orange-500">B 段 (A大调)</strong>: 雄壮开阔的“土耳其军乐”主题，作为插部反复出现了三次。</p>
                </div>
                <div className="space-y-2">
                  <p><strong className="text-purple-500">C 段 (f#小调)</strong>: 密集的音流旋转奔跑，是全曲色彩最暗淡、最紧张的展开部分。</p>
                  <p><strong className="text-red-600">Coda (A大调)</strong>: 辉煌的尾声，通过八度大跳和热烈的和弦走向终点。</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleRestart} className="flex-1 py-6 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all border border-white/10 uppercase tracking-widest text-sm">
                重新挑战
              </button>
              <button onClick={() => alert('侦探勋章已保存！')} className="flex-1 py-6 bg-cyan-500 hover:bg-cyan-400 text-[#0a0a1a] font-black rounded-2xl transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                <Share2 className="w-5 h-5" /> 分享报告
              </button>
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} src={AUDIO_URL} preload="auto" />

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        
        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); }
        }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
};

export default App;
