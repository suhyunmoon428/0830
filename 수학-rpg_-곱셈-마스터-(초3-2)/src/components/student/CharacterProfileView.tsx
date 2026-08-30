import React, { useState } from 'react';
import { StudentData, JobType } from '../../types';
import { JOB_DESCRIPTIONS, MATH_SKILLS, getExpNeededForNextLevel } from '../../data/gameData';
import { DataService } from '../../services/dataService';
import { AvatarDisplay } from '../common/AvatarDisplay';
import {
  ArrowLeft,
  Sparkles,
  Award,
  Zap,
  Coins,
  Shield,
  Heart,
  Edit3,
  Check,
  Lock,
} from 'lucide-react';

interface CharacterProfileViewProps {
  student: StudentData;
  onBack: () => void;
  onOpenCustomizer: () => void;
  onStudentUpdated: (student: StudentData) => void;
}

export const CharacterProfileView: React.FC<CharacterProfileViewProps> = ({
  student,
  onBack,
  onOpenCustomizer,
  onStudentUpdated,
}) => {
  const jobInfo = JOB_DESCRIPTIONS[student.character.job] || JOB_DESCRIPTIONS.warrior;
  const currentLevelExp = getExpNeededForNextLevel(student.character.level);
  const expPercent = Math.min(Math.round((student.character.exp / currentLevelExp) * 100), 100);

  // Available skills for job
  const jobSkills = MATH_SKILLS.filter((s) => s.job === student.character.job);

  const handleSelectTitle = (title: string) => {
    const updated = { ...student };
    updated.character.equipment.title = title;
    DataService.saveStudentData(updated);
    onStudentUpdated(updated);
  };

  return (
    <div id="character-profile-view" className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              id="btn-profile-back"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black font-rpg text-slate-800">모험가 프로필 & 성장 기록</h2>
          </div>

          <button
            id="btn-open-customizer"
            onClick={onOpenCustomizer}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-xs active:scale-95 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>캐릭터 / 직업 변경</span>
          </button>
        </div>
      </header>

      {/* Main Sheet */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Character Card & Stats */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center justify-between space-y-6">
          <div className="flex flex-col items-center text-center w-full">
            <AvatarDisplay character={student.character} size="xl" showDetails={true} />

            {/* EXP Gauge */}
            <div className="w-full mt-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 mb-1">
                <span>경험치 (EXP)</span>
                <span className="text-sky-600">
                  {student.character.exp} / {currentLevelExp} ({expPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-400 to-blue-500 h-full transition-all duration-500"
                  style={{ width: `${expPercent}%` }}
                />
              </div>
            </div>

            {/* Gold & Stickers */}
            <div className="w-full grid grid-cols-2 gap-2 mt-3 text-xs font-extrabold">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center">
                <span className="text-slate-500 text-[10px]">보유 골드</span>
                <span className="text-amber-700 text-sm mt-0.5">{student.character.gold} Gold</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col items-center">
                <span className="text-slate-500 text-[10px]">칭찬 스티커</span>
                <span className="text-rose-600 text-sm mt-0.5">
                  ⭐ {student.character.praiseStickers || 0}개
                </span>
              </div>
            </div>
          </div>

          {/* Job Trait Box */}
          <div className="w-full bg-gradient-to-br from-slate-50 to-sky-50 p-4 rounded-2xl border border-sky-200 text-xs">
            <div className="font-extrabold text-slate-800 mb-1 flex items-center gap-1.5">
              <span>{jobInfo.icon}</span>
              <span>{jobInfo.name} 패시브 특성</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">{jobInfo.summary}</p>
            <div className="mt-2 text-[11px] font-bold text-sky-700 bg-white/80 p-2 rounded-xl border border-sky-100">
              ⚡ {jobInfo.bonus}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Skills & Titles */}
        <div className="md:col-span-2 space-y-6">
          {/* Skill Tree */}
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-800">
                  직업 고유 스킬 트리 (Lv.1 ~ Lv.20)
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                해금: {student.character.skills.length}/{jobSkills.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobSkills.map((skill) => {
                const isUnlocked = student.character.skills.includes(skill.id);
                return (
                  <div
                    key={skill.id}
                    className={`p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                      isUnlocked
                        ? 'bg-amber-50/50 border-amber-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <span className="text-2xl p-2 bg-white rounded-xl shadow-2xs">
                      {isUnlocked ? skill.icon : '🔒'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-800">{skill.name}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isUnlocked
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          Lv.{skill.requiredLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Titles & Achievements */}
          <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-extrabold text-slate-800">보유 칭호 선택</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                장착 중: {student.character.equipment.title || '없음'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {student.character.titles.map((title) => {
                const isSelected = student.character.equipment.title === title;
                return (
                  <button
                    key={title}
                    id={`btn-select-title-${title}`}
                    onClick={() => handleSelectTitle(title)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-purple-50 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
