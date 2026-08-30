import React, { useState } from 'react';
import { StudentData, StudentAiAssessment } from '../../types';
import { STAGES_METADATA } from '../../data/gameData';
import { GameService } from '../../services/gameService';
import { DataService } from '../../services/dataService';
import { AiAssessmentService } from '../../services/aiAssessmentService';
import { AvatarDisplay } from '../common/AvatarDisplay';
import {
  X,
  Award,
  Sparkles,
  Zap,
  Coins,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Gift,
  KeyRound,
  Bot,
  RefreshCw,
  Copy,
  Check,
  Edit3,
  Save,
  Clock,
} from 'lucide-react';

interface StudentDetailModalProps {
  student: StudentData;
  isOpen: boolean;
  onClose: () => void;
  onStudentUpdated: () => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onStudentUpdated,
}) => {
  const [rewardFeedback, setRewardFeedback] = useState<string | null>(null);
  const [currentStudent, setCurrentStudent] = useState<StudentData>(student);

  // AI Assessment UI states
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState<boolean>(false);
  const [isEditingAssessment, setIsEditingAssessment] = useState<boolean>(false);
  const [draftAssessmentText, setDraftAssessmentText] = useState<string>(
    student.aiAssessment?.text || ''
  );
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setRewardFeedback(msg);
    setTimeout(() => setRewardFeedback(null), 3000);
  };

  const handleGrantReward = (
    type: 'sticker' | 'exp50' | 'gold50' | 'title_master' | 'item_praise'
  ) => {
    const res = GameService.grantTeacherReward(currentStudent.account.id, type);
    if (res.success && res.updatedStudent) {
      setCurrentStudent(res.updatedStudent);
      onStudentUpdated();
      showFeedback(res.message);
    }
  };

  const handleResetPassword = () => {
    const res = DataService.resetStudentPassword(currentStudent.account.id, '1234');
    if (res) {
      const updated = DataService.getStudentData(currentStudent.account.id);
      if (updated) {
        setCurrentStudent(updated);
        onStudentUpdated();
        showFeedback('비밀번호를 초기 비밀번호(1234)로 재설정했습니다.');
      }
    }
  };

  // Generate / Regenerate AI Assessment
  const handleGenerateAssessment = async (isRegenerate = false) => {
    setIsGeneratingAssessment(true);
    try {
      const historyCount = currentStudent.aiAssessment?.history?.length || 0;
      const res = await AiAssessmentService.generateSingleAssessment(currentStudent, {
        variationIndex: isRegenerate ? historyCount + 1 : 0,
      });

      if (res.success && res.assessment) {
        AiAssessmentService.saveStudentAssessment(currentStudent.account.id, res.assessment);
        const updated = DataService.getStudentData(currentStudent.account.id);
        if (updated) {
          setCurrentStudent(updated);
          setDraftAssessmentText(res.assessment.text);
          setIsEditingAssessment(false);
          onStudentUpdated();
          showFeedback(
            isRegenerate
              ? '새로운 문장 구조와 표현으로 평어를 다시 생성했습니다.'
              : '맞춤형 수학 평어가 생성되었습니다.'
          );
        }
      } else {
        showFeedback(`평어 생성 실패: ${res.error || '네트워크 상태 확인 필요'}`);
      }
    } catch (e: any) {
      showFeedback(`평어 생성 오류: ${e.message}`);
    } finally {
      setIsGeneratingAssessment(false);
    }
  };

  // Save manual edit of assessment
  const handleSaveAssessmentEdit = () => {
    if (!draftAssessmentText.trim()) {
      showFeedback('평어 내용을 입력해주세요.');
      return;
    }

    const currentAss = currentStudent.aiAssessment || {
      text: draftAssessmentText.trim(),
      summaryTraits: '교사 직접 작성',
      generatedAt: new Date().toISOString(),
    };

    const updatedAss: StudentAiAssessment = {
      ...currentAss,
      text: draftAssessmentText.trim(),
      isCustomEdited: true,
      generatedAt: new Date().toISOString(),
    };

    AiAssessmentService.saveStudentAssessment(currentStudent.account.id, updatedAss);
    const updated = DataService.getStudentData(currentStudent.account.id);
    if (updated) {
      setCurrentStudent(updated);
      setIsEditingAssessment(false);
      onStudentUpdated();
      showFeedback('수정된 평어가 저장되었습니다.');
    }
  };

  // Copy assessment to clipboard
  const handleCopyAssessment = async () => {
    const textToCopy = currentStudent.aiAssessment?.text || draftAssessmentText;
    if (!textToCopy) return;

    const success = await AiAssessmentService.copyToClipboard(textToCopy);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      showFeedback('생활기록부용 수학 평어가 복사되었습니다.');
    }
  };

  // Collect wrong questions
  const allWrongQuestions = [];
  for (let st = 1; st <= 12; st++) {
    const stageRec = currentStudent.stages[st];
    if (stageRec && stageRec.wrongQuestions) {
      allWrongQuestions.push(...stageRec.wrongQuestions);
    }
  }

  return (
    <div
      id="student-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-white rounded-[28px] shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <AvatarDisplay character={currentStudent.character} size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {currentStudent.account.name} 학생 상세 학습 분석
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 bg-white/10 text-slate-300 rounded-full font-medium font-mono">
                  {currentStudent.account.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Lv.{currentStudent.character.level} {currentStudent.character.nickname} (
                {currentStudent.character.job === 'warrior'
                  ? '전사'
                  : currentStudent.character.job === 'wizard'
                  ? '마법사'
                  : currentStudent.character.job === 'healer'
                  ? '힐러'
                  : '탐험가'}
                )
              </p>
            </div>
          </div>
          <button
            id="btn-close-student-detail"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Teacher Reward Alert */}
          {rewardFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{rewardFeedback}</span>
            </div>
          )}

          {/* Teacher Instant Reward Toolbar */}
          <div className="bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-slate-50 p-5 rounded-[22px] border border-indigo-100 shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 mb-3">
              <Gift className="w-4 h-4 text-indigo-600" />
              <span>교사 즉시 보상 지급 도구 (학생 성취 격려)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                id="btn-grant-sticker"
                onClick={() => handleGrantReward('sticker')}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-xl text-xs shadow-2xs active:scale-95 transition-all"
              >
                ⭐ 칭찬 스티커 지급 (+30 EXP, +20 G)
              </button>
              <button
                id="btn-grant-exp"
                onClick={() => handleGrantReward('exp50')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-2xs active:scale-95 transition-all"
              >
                ⚡ 보너스 경험치 (+50 EXP)
              </button>
              <button
                id="btn-grant-gold"
                onClick={() => handleGrantReward('gold50')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-2xs active:scale-95 transition-all"
              >
                💰 보너스 골드 (+50 Gold)
              </button>
              <button
                id="btn-grant-title"
                onClick={() => handleGrantReward('title_master')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-2xs active:scale-95 transition-all"
              >
                👑 특별 칭호 [선생님의 자랑] 수여
              </button>
              <button
                id="btn-grant-item"
                onClick={() => handleGrantReward('item_praise')}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-2xs active:scale-95 transition-all"
              >
                🛡️ 특별 아이템 [무지개 방패] 지급
              </button>
              <button
                id="btn-reset-pw"
                onClick={handleResetPassword}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all ml-auto"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>비밀번호 1234로 초기화</span>
              </button>
            </div>
          </div>

          {/* AI Math Assessment (학교생활기록부 맞춤형 평어) Card */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60 p-5 rounded-[24px] border border-indigo-200/80 shadow-xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-2xs">
                  ✨
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>AI 맞춤형 수학 평어</span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                      생활기록부 교과학습발달상황용
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    전체 12개 차시 학습 정답률, 도달 수준, 오답 자기수정, 문제 만들기 등 종합 데이터 기반
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!currentStudent.aiAssessment?.text ? (
                  <button
                    id="btn-generate-student-ai-assessment"
                    onClick={() => handleGenerateAssessment(false)}
                    disabled={isGeneratingAssessment}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    {isGeneratingAssessment ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>AI 수학 평어 생성</span>
                  </button>
                ) : (
                  <button
                    id="btn-regenerate-student-ai-assessment"
                    onClick={() => handleGenerateAssessment(true)}
                    disabled={isGeneratingAssessment}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                    title="새로운 문장 구조와 어휘로 다시 생성"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAssessment ? 'animate-spin' : ''}`} />
                    <span>다시 생성</span>
                  </button>
                )}
              </div>
            </div>

            {/* Assessment Content Box */}
            {currentStudent.aiAssessment?.text ? (
              <div className="space-y-3">
                {/* Traits Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">진단 특성:</span>
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold rounded-lg">
                      🏷️ {currentStudent.aiAssessment.summaryTraits || '수학적 개념 이해 및 성실한 과제 수행'}
                    </span>
                  </div>

                  {currentStudent.aiAssessment.history && currentStudent.aiAssessment.history.length > 0 && (
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-[11px] text-slate-500 hover:text-indigo-600 font-semibold flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>이전 생성 기록 ({currentStudent.aiAssessment.history.length}건)</span>
                    </button>
                  )}
                </div>

                {/* Text View / Edit Mode */}
                {isEditingAssessment ? (
                  <div className="space-y-2">
                    <textarea
                      value={draftAssessmentText}
                      onChange={(e) => setDraftAssessmentText(e.target.value)}
                      rows={3}
                      className="w-full p-3 text-xs rounded-xl border border-indigo-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 leading-relaxed font-sans"
                      placeholder="생활기록부에 기재할 수학 평어를 수정하세요..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setIsEditingAssessment(false);
                          setDraftAssessmentText(currentStudent.aiAssessment?.text || '');
                        }}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSaveAssessmentEdit}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>저장하기</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-medium shadow-2xs">
                    <p className="select-all">{currentStudent.aiAssessment.text}</p>
                  </div>
                )}

                {/* History Drawer */}
                {showHistory && currentStudent.aiAssessment.history && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-700 text-[11px]">이전 생성 이력 (클릭하여 불러오기)</div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {currentStudent.aiAssessment.history.map((hist, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setDraftAssessmentText(hist.text);
                            setIsEditingAssessment(true);
                            setShowHistory(false);
                          }}
                          className="p-2 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 text-[11px] text-slate-600 cursor-pointer transition-colors"
                        >
                          <div className="text-[10px] text-slate-400 font-mono mb-0.5">
                            {new Date(hist.generatedAt).toLocaleString()}
                          </div>
                          <p className="line-clamp-2">{hist.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="text-[11px] text-slate-400">
                    생성일: {new Date(currentStudent.aiAssessment.generatedAt).toLocaleDateString()}
                    {currentStudent.aiAssessment.isCustomEdited && ' (교사 수정 완료)'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id="btn-edit-student-assessment"
                      onClick={() => {
                        setDraftAssessmentText(currentStudent.aiAssessment?.text || '');
                        setIsEditingAssessment(!isEditingAssessment);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors active:scale-95"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingAssessment ? '수정 취소' : '수정하기'}</span>
                    </button>

                    <button
                      id="btn-copy-student-assessment"
                      onClick={handleCopyAssessment}
                      className={`flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs active:scale-95 ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? '복사 완료' : '복사하기'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white/70 rounded-xl border border-dashed border-indigo-200 text-center space-y-1.5">
                <p className="text-xs font-semibold text-slate-600">
                  아직 생성된 수학 평어가 없습니다.
                </p>
                <p className="text-[11px] text-slate-400">
                  위의 <strong>[AI 수학 평어 생성]</strong> 버튼을 누르면 12개 차시 학습 데이터를 분석하여 학교생활기록부 문장 1~2문장을 자동 구성합니다.
                </p>
              </div>
            )}
          </div>

          {/* 12 Stage Progress Cards Grid */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3">12개 차시별 성취 수준</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {STAGES_METADATA.map((stage) => {
                const rec = currentStudent.stages[stage.id];
                const totalTries = rec ? rec.correctCount + rec.wrongCount : 0;
                const acc = totalTries > 0 ? Math.round((rec.correctCount / totalTries) * 100) : 0;

                return (
                  <div
                    key={stage.id}
                    className={`p-3.5 rounded-[18px] border text-xs flex flex-col justify-between transition-colors ${
                      rec?.completed
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : totalTries > 0
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-slate-50 border-slate-200/80 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-900">{stage.id}차시</span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            rec?.mastery === '완전정복'
                              ? 'bg-purple-100 text-purple-800'
                              : rec?.mastery === '심화'
                              ? 'bg-indigo-100 text-indigo-800'
                              : rec?.mastery === '기본'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {rec?.mastery || '미학습'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-1">
                        {stage.title.split(': ')[1] || stage.title}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-500 flex justify-between font-medium">
                      <span>정답률 {acc}%</span>
                      <span>
                        정답 {rec?.correctCount || 0} / 오답 {rec?.wrongCount || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Wrong Answer History Logs */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>오답 기록 및 오류 유형 분석 (총 {allWrongQuestions.length}건)</span>
            </h4>

            {allWrongQuestions.length === 0 ? (
              <div className="p-8 bg-slate-50 border border-slate-200/80 rounded-[20px] text-center text-xs font-semibold text-slate-400">
                기록된 오답이 없습니다. 훌륭한 연산 실력을 보여주고 있습니다!
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200/80 rounded-[20px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-3">차시</th>
                      <th className="p-3">문제</th>
                      <th className="p-3">학생 답안</th>
                      <th className="p-3">정답</th>
                      <th className="p-3">진단된 오류 유형</th>
                      <th className="p-3">재시도</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allWrongQuestions.slice(-10).map((wq, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 font-medium">
                        <td className="p-3 font-bold text-indigo-600">{wq.stageId}차시</td>
                        <td className="p-3 font-mono">{wq.problem}</td>
                        <td className="p-3 font-mono text-rose-600 font-bold">{wq.studentAns}</td>
                        <td className="p-3 font-mono text-emerald-600 font-bold">
                          {wq.correctAns}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px]">
                            {wq.errorType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">{wq.retryCount}회</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-xs transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
