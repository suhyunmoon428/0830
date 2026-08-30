import React, { useState } from 'react';
import { StudentData, MathMonster } from '../../types';
import { MATH_MONSTERS } from '../../data/gameData';
import { ArrowLeft, BookOpen, Lock, Sparkles, Trophy, Shield, Zap } from 'lucide-react';

interface MonsterBookViewProps {
  student: StudentData;
  onBack: () => void;
}

export const MonsterBookView: React.FC<MonsterBookViewProps> = ({ student, onBack }) => {
  const [selectedMonster, setSelectedMonster] = useState<MathMonster | null>(null);

  const ownedMonstersCount = student.character.mathMonsters.length;
  const totalMonsters = MATH_MONSTERS.length;
  const progressPercent = Math.round((ownedMonstersCount / totalMonsters) * 100);

  return (
    <div id="monster-book-view" className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              id="btn-monster-book-back"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black font-rpg text-slate-800">
                수학몬 도감 (12대 정령 & 전설용)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>
                수집률: {ownedMonstersCount}/{totalMonsters} ({progressPercent}%)
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black font-rpg tracking-wide">
              수학몬을 모두 모아 곱셈의 수호자가 되세요!
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              각 스테이지를 클리어하거나 특별 업적을 달성하면 수학몬의 봉인이 해제됩니다.
            </p>
          </div>
          <div className="w-full sm:w-48 bg-black/20 backdrop-blur-xs p-3 rounded-2xl border border-white/20">
            <div className="text-[11px] font-bold text-emerald-200 mb-1">도감 완성도</div>
            <div className="w-full bg-emerald-900/50 rounded-full h-3 overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* 12 Monsters + Rare Monsters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {MATH_MONSTERS.map((monster) => {
            const isUnlocked = student.character.mathMonsters.includes(monster.id);

            return (
              <button
                key={monster.id}
                id={`monster-card-${monster.id}`}
                onClick={() => setSelectedMonster(monster)}
                className={`p-4 rounded-3xl border-2 text-left transition-all relative flex flex-col items-center justify-between min-h-[170px] ${
                  isUnlocked
                    ? 'bg-white border-emerald-300 hover:border-emerald-500 shadow-sm hover:-translate-y-1'
                    : 'bg-slate-200/70 border-slate-300 opacity-60 hover:opacity-80'
                }`}
              >
                {monster.isRare && (
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-400 text-amber-950">
                    전설
                  </span>
                )}

                {/* Stage Badge */}
                <div className="self-start text-[10px] font-black text-slate-500">
                  {monster.stageId ? `${monster.stageId}차시` : '업적'}
                </div>

                {/* Monster Graphic */}
                <div className="my-2 flex items-center justify-center">
                  {isUnlocked ? (
                    <span className="text-4xl filter drop-shadow animate-pulse-subtle">
                      {monster.imageEmoji}
                    </span>
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-slate-300 flex items-center justify-center text-slate-500 text-xl font-bold">
                      <Lock className="w-5 h-5" />
                    </div>
                  )}
                </div>

                {/* Monster Name & Concept */}
                <div className="text-center w-full">
                  <div className="text-xs font-black text-slate-800 truncate">
                    {isUnlocked ? monster.name : '??? (미확인 정령)'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {isUnlocked ? (monster.concept || monster.title) : '스테이지 클리어 시 해금'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Monster Detail Popup */}
      {selectedMonster && (
        <div
          id="monster-detail-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="flex flex-col w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-emerald-400 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="text-lg font-black font-rpg">수학몬 상세 정보</h3>
              </div>
              <button
                id="btn-close-monster-detail"
                onClick={() => setSelectedMonster(null)}
                className="p-1 rounded-lg hover:bg-emerald-600"
              >
                닫기
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-center">
              <div className="w-24 h-24 mx-auto bg-emerald-50 border-2 border-emerald-200 rounded-3xl flex items-center justify-center text-5xl shadow-inner">
                {student.character.mathMonsters.includes(selectedMonster.id)
                  ? selectedMonster.imageEmoji
                  : '❓'}
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-800">{selectedMonster.name}</h4>
                <div className="text-xs font-bold text-emerald-700 bg-emerald-50 inline-block px-3 py-1 rounded-full mt-1 border border-emerald-200">
                  수학 개념: {selectedMonster.concept || selectedMonster.title || selectedMonster.element}
                </div>
              </div>

              <div className="text-left bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 text-slate-700">
                <div>
                  <span className="font-extrabold text-slate-800">📖 전설 배경:</span>{' '}
                  {selectedMonster.lore || selectedMonster.description}
                </div>
                {selectedMonster.unlockHint && (
                  <div>
                    <span className="font-extrabold text-purple-700">🎯 해금 조건:</span>{' '}
                    {selectedMonster.unlockHint}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                <div className="p-2 bg-slate-100 rounded-xl flex items-center justify-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-sky-600" />
                  <span>방어력: 120</span>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>수학 마력: 250</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                id="btn-monster-detail-ok"
                onClick={() => setSelectedMonster(null)}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
