import React from 'react';
import { StudentData, StageInfo, StageRecord } from '../../types';
import { STAGES_METADATA, MATH_MONSTERS } from '../../data/gameData';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { 
  Sparkles, 
  Coins, 
  BookOpen, 
  ShoppingBag, 
  User, 
  LogOut, 
  Lock, 
  Star, 
  Trophy, 
  Compass,
  Zap
} from 'lucide-react';

interface WorldMapViewProps {
  student: StudentData;
  onSelectStage: (stageId: number) => void;
  onOpenShop: () => void;
  onOpenMonsterBook: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const WorldMapView: React.FC<WorldMapViewProps> = ({
  student,
  onSelectStage,
  onOpenShop,
  onOpenMonsterBook,
  onOpenProfile,
  onLogout,
}) => {
  // Determine unlocked state for stages
  const getStageStatus = (stageId: number): 'locked' | 'ready' | 'cleared' | 'mastered' => {
    const stageRec = student.stages[stageId];
    if (stageRec && stageRec.completed) {
      if (stageRec.mastery === '완전정복' || stageRec.mastery === '심화') {
        return 'mastered';
      }
      return 'cleared';
    }

    // Unlocked if stage 1 or previous stage is completed
    if (stageId === 1) return 'ready';
    const prevStage = student.stages[stageId - 1];
    if (prevStage && prevStage.completed) return 'ready';

    return 'locked';
  };

  // Calculate completed count
  const completedCount = Object.values(student.stages).filter((s: StageRecord) => s.completed).length;

  return (
    <div id="world-map-view" className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top RPG Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-4 py-2.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Student Profile Capsule */}
          <div className="flex items-center gap-3">
            <button
              id="btn-nav-profile-avatar"
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 p-1 bg-slate-50 hover:bg-sky-50 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all text-left group"
            >
              <AvatarDisplay character={student.character} size="sm" />
              <div className="pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-800 group-hover:text-sky-700">
                    {student.character.nickname}
                  </span>
                  <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full bg-sky-500 text-white">
                    Lv.{student.character.level}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {student.account.name} ({student.account.id})
                </div>
              </div>
            </button>

            {/* EXP Bar & Gold */}
            <div className="hidden sm:flex flex-col gap-1">
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                <Coins className="w-3.5 h-3.5" />
                <span>{student.character.gold} Gold</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                <Zap className="w-3 h-3 text-sky-500" />
                <span>EXP {student.character.exp}</span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-nav-shop"
              onClick={onOpenShop}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black rounded-xl text-xs shadow-xs active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>상점</span>
            </button>

            <button
              id="btn-nav-monster-book"
              onClick={onOpenMonsterBook}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl text-xs shadow-xs active:scale-95 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>도감 ({student.character.mathMonsters.length}/12)</span>
            </button>

            <button
              id="btn-nav-profile"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 active:scale-95 transition-all"
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">내 정보</span>
            </button>

            <button
              id="btn-student-logout"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main World Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* World Banner & Progress */}
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-sky-100 text-xs font-extrabold mb-2 backdrop-blur-xs">
                <Compass className="w-3.5 h-3.5" />
                <span>3학년 2학기 1단원 곱셈 월드</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-rpg tracking-wide">
                곱셈 대륙의 12대 성역
              </h2>
              <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
                차례대로 스테이지를 클리어하고 수학몬을 수집하여 최종 곱셈 마왕성에 도전하세요!
              </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between bg-black/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
              <div className="text-xs font-bold text-sky-200">대륙 정복률</div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-rpg">
                {completedCount} / 12 차시 ({Math.round((completedCount / 12) * 100)}%)
              </div>
            </div>
          </div>
        </div>

        {/* 12 Stage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STAGES_METADATA.map((stage) => {
            const status = getStageStatus(stage.id);
            const stageRec = student.stages[stage.id];
            const isLocked = status === 'locked';
            const isMastered = status === 'mastered';
            const isCleared = status === 'cleared';
            const monster = MATH_MONSTERS.find((m) => m.stageId === stage.id);
            const isMonsterOwned = monster && student.character.mathMonsters.includes(monster.id);

            return (
              <div
                key={stage.id}
                id={`stage-card-${stage.id}`}
                className={`relative rounded-3xl border-3 transition-all flex flex-col justify-between overflow-hidden p-5 ${
                  isLocked
                    ? 'bg-slate-200/80 border-slate-300 opacity-70'
                    : isMastered
                    ? 'bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 border-amber-400 shadow-md hover:-translate-y-1'
                    : isCleared
                    ? 'bg-white border-emerald-400 shadow-sm hover:-translate-y-1'
                    : 'bg-white border-sky-400 shadow-md hover:-translate-y-1 ring-2 ring-sky-300/50 animate-pulse-subtle'
                }`}
              >
                {/* Card Top: Stage ID & Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm ${
                        isLocked
                          ? 'bg-slate-300 text-slate-600'
                          : isMastered
                          ? 'bg-amber-400 text-amber-950 shadow-xs'
                          : isCleared
                          ? 'bg-emerald-500 text-white'
                          : 'bg-sky-500 text-white shadow-xs'
                      }`}
                    >
                      {stage.id}
                    </span>
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <span>{stage.worldName}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                        {stage.title.split(': ')[1] || stage.title}
                      </h3>
                    </div>
                  </div>

                  {/* Status Indicator Pill */}
                  <div>
                    {isLocked && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-300 text-slate-700 text-xs font-bold">
                        <Lock className="w-3 h-3" />
                        잠김
                      </span>
                    )}
                    {status === 'ready' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500 text-white text-xs font-extrabold shadow-xs">
                        <Sparkles className="w-3 h-3" />
                        도전 가능
                      </span>
                    )}
                    {isCleared && !isMastered && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold">
                        <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                        기본 완료
                      </span>
                    )}
                    {isMastered && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black shadow-xs">
                        <Trophy className="w-3 h-3 text-amber-600" />
                        {stageRec?.mastery || '완전정복'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subtitle & Desc */}
                <p className="text-xs text-slate-600 mb-4 line-clamp-2 min-h-[32px]">
                  {stage.subtitle}
                </p>

                {/* Monster Reward Preview & Action Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {monster && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span
                        className={`text-xl p-1 rounded-xl border ${
                          isMonsterOwned ? 'bg-amber-100 border-amber-300' : 'bg-slate-100 border-slate-200 grayscale opacity-60'
                        }`}
                        title={monster.name}
                      >
                        {monster.imageEmoji}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600">
                        {monster.name}
                      </span>
                    </div>
                  )}

                  <button
                    id={`btn-enter-stage-${stage.id}`}
                    disabled={isLocked}
                    onClick={() => onSelectStage(stage.id)}
                    className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 ${
                      isLocked
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : isMastered
                        ? 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-xs active:scale-95'
                        : isCleared
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs active:scale-95'
                        : 'bg-sky-500 hover:bg-sky-600 text-white shadow-md active:scale-95'
                    }`}
                  >
                    {isLocked ? (
                      '이전 차시 완료 필요'
                    ) : isMastered ? (
                      '무한 심화 도전 ⚔️'
                    ) : isCleared ? (
                      '다시 학습하기 🔄'
                    ) : (
                      '학습 시작하기 🚀'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
