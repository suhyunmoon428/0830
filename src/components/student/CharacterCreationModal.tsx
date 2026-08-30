import React, { useState } from 'react';
import { DataService } from '../../services/dataService';
import { StudentData, JobType } from '../../types';
import { JOB_DESCRIPTIONS, MATH_SKILLS } from '../../data/gameData';
import { Sparkles, Check, ChevronRight } from 'lucide-react';

interface CharacterCreationModalProps {
  student: StudentData;
  onComplete: (updatedStudent: StudentData) => void;
}

export const CharacterCreationModal: React.FC<CharacterCreationModalProps> = ({
  student,
  onComplete,
}) => {
  const [selectedJob, setSelectedJob] = useState<JobType>(student.character.job || 'warrior');
  const [nickname, setNickname] = useState(student.character.nickname || student.account.name || '모험가');
  const [hairStyle, setHairStyle] = useState(student.character.appearance?.hairStyle || 'short');
  const [hairColor, setHairColor] = useState(student.character.appearance?.hairColor || '#4B5563');
  const [outfit, setOutfit] = useState(student.character.appearance?.outfit || 'apprentice');

  const jobs: JobType[] = ['warrior', 'wizard', 'healer', 'explorer'];

  const hairColors = [
    { name: '흑발', color: '#1F2937' },
    { name: '갈색', color: '#92400E' },
    { name: '금발', color: '#F59E0B' },
    { name: '파랑', color: '#3B82F6' },
    { name: '붉은색', color: '#EF4444' },
  ];

  const handleSave = () => {
    const defaultSkill =
      selectedJob === 'warrior'
        ? 'skill_w_1'
        : selectedJob === 'wizard'
        ? 'skill_m_1'
        : selectedJob === 'healer'
        ? 'skill_h_1'
        : 'skill_e_1';

    const updated: StudentData = {
      ...student,
      character: {
        ...student.character,
        nickname: nickname.trim() || student.account.name,
        job: selectedJob,
        appearance: {
          base: 'avatar_1',
          hairStyle,
          hairColor,
          outfit,
        },
        skills: student.character.skills.includes(defaultSkill)
          ? student.character.skills
          : [defaultSkill],
      },
    };

    DataService.saveStudentData(updated);
    onComplete(updated);
  };

  const currentJobInfo = JOB_DESCRIPTIONS[selectedJob];
  const starterSkill = MATH_SKILLS.find((s) => s.job === selectedJob && s.requiredLevel === 1);

  return (
    <div id="character-creation-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="flex flex-col w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border-4 border-sky-400 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-300 animate-spin" />
            <h2 className="text-xl sm:text-2xl font-black font-rpg">수학 캐릭터 & 직업 생성</h2>
          </div>
          <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
            {student.account.name} 학생 ({student.account.id})
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. Nickname Input */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              캐릭터 닉네임
            </label>
            <input
              id="input-character-nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 번개곱셈용사"
              maxLength={12}
              className="w-full max-w-sm px-4 py-2.5 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-800 focus:border-sky-500 focus:outline-hidden text-base"
            />
          </div>

          {/* 2. Job Selection */}
          <div>
            <label className="block text-sm font-extrabold text-slate-800 mb-3">
              직업 선택 (4대 모험가 클래스)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {jobs.map((j) => {
                const info = JOB_DESCRIPTIONS[j];
                const isSelected = selectedJob === j;
                return (
                  <button
                    key={j}
                    id={`btn-job-select-${j}`}
                    type="button"
                    onClick={() => setSelectedJob(j)}
                    className={`flex flex-col p-4 text-left rounded-2xl border-3 transition-all relative ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/80 shadow-md ring-2 ring-sky-300'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 bg-sky-500 text-white rounded-full">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <span className="text-base font-extrabold text-slate-800">{info.name}</span>
                        <span className="ml-1.5 text-xs text-sky-600 font-bold">[{info.badge}]</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mb-1">{info.summary}</p>
                    <div className="text-[11px] font-bold text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                      ⚡ 특성: {info.bonus}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Job Starter Skill Preview */}
          {starterSkill && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-sky-50 rounded-2xl border border-amber-200 flex items-center gap-3">
              <span className="text-3xl p-2 bg-white rounded-xl shadow-xs">{starterSkill.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-800">
                    전용 기본 스킬: {starterSkill.name}
                  </span>
                  <span className="text-[10px] bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    Lv.1 즉시 사용
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{starterSkill.description}</p>
              </div>
            </div>
          )}

          {/* 4. Appearance Customization */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              외형 스타일
            </h3>

            <div>
              <span className="text-xs font-bold text-slate-600 block mb-1.5">헤어 색상</span>
              <div className="flex gap-2">
                {hairColors.map((hc) => (
                  <button
                    key={hc.color}
                    type="button"
                    onClick={() => setHairColor(hc.color)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      hairColor === hc.color
                        ? 'border-sky-500 bg-white shadow-xs ring-2 ring-sky-300 text-slate-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/20" style={{ backgroundColor: hc.color }} />
                    {hc.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-600 block mb-1.5">기본 의상 스타일</span>
              <div className="flex gap-2">
                {[
                  { id: 'apprentice', name: '견습 모험복 🥋' },
                  { id: 'adventurer', name: '가죽 여행복 🦺' },
                  { id: 'scholar', name: '학자 예복 🧥' },
                ].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOutfit(o.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      outfit === o.id
                        ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3">
          <button
            id="btn-complete-character-creation"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold rounded-2xl shadow-md active:scale-95 transition-all text-base"
          >
            <span>모험 월드맵 입장</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
