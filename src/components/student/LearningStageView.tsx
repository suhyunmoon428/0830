import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { DataService } from '../../services/dataService';
import { LearningService } from '../../services/learningService';
import { GameService } from '../../services/gameService';
import { GasService } from '../../services/gasService';
import { StudentData, MathProblem, ErrorType, MathSkill, GasStageSubmission } from '../../types';
import { STAGES_METADATA, MATH_SKILLS } from '../../data/gameData';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { ScratchpadModal } from '../common/ScratchpadModal';
import {
  ArrowLeft,
  Coins,
  Sparkles,
  Flame,
  HelpCircle,
  Pencil,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Timer,
  Trophy,
  ChevronRight,
  Shield,
  Zap,
  Cloud,
  CloudCheck,
  CloudAlert,
  Loader2,
} from 'lucide-react';

interface LearningStageViewProps {
  student: StudentData;
  stageId: number;
  onBackToMap: () => void;
  onStudentUpdated: (student: StudentData) => void;
}

export const LearningStageView: React.FC<LearningStageViewProps> = ({
  student,
  stageId,
  onBackToMap,
  onStudentUpdated,
}) => {
  const stageInfo = STAGES_METADATA.find((s) => s.id === stageId) || STAGES_METADATA[0];

  // Stage questions pool (curated 15)
  const [curriculum] = useState<MathProblem[]>(() => LearningService.getStageCurriculum(stageId));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(() => curriculum[0] || LearningService.generateProceduralProblem(stageId, 1));

  // Answer & feedback states
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [comboCount, setComboCount] = useState<number>(0);
  const [failCount, setFailCount] = useState<number>(0);
  const [activeHintLevel, setActiveHintLevel] = useState<number>(0);
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'wrong' | null;
    message: string;
    expGained?: number;
    goldGained?: number;
    bonusMsg?: string;
  }>({ type: null, message: '' });

  // Stage session stats
  const [sessionCorrect, setSessionCorrect] = useState<number>(0);
  const [sessionWrong, setSessionWrong] = useState<number>(0);
  const [stageClearedModal, setStageClearedModal] = useState<{
    open: boolean;
    monsterUnlocked?: string;
    rareUnlocked?: string;
  }>({ open: false });

  // Google Sheets Cloud Sync Status
  const [cloudSyncState, setCloudSyncState] = useState<{
    status: 'idle' | 'saving' | 'saved' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Skill active visual effects
  const [activeSkillHighlight, setActiveSkillHighlight] = useState<boolean>(false);
  const [activeMagicGrid, setActiveMagicGrid] = useState<boolean>(false);
  const [activeSkillBanner, setActiveSkillBanner] = useState<string | null>(null);

  // Scratchpad modal
  const [isScratchpadOpen, setIsScratchpadOpen] = useState<boolean>(false);

  // Stage 11 Speed Mode Timer (45 seconds)
  const isSpeedStage = stageId === 11;
  const [timeLeft, setTimeLeft] = useState<number>(45);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isSpeedStage && !feedback.type && !stageClearedModal.open) {
      setTimeLeft(45);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, feedback.type, stageClearedModal.open]);

  const handleTimeOut = () => {
    if (feedback.type) return;
    setFailCount((f) => f + 1);
    setSessionWrong((w) => w + 1);
    setComboCount(0);
    setFeedback({
      type: 'wrong',
      message: '⏰ 시간이 초과되었습니다! 차분하게 다시 풀어보세요.',
    });
  };

  const handleKeypadPress = (key: string) => {
    if (feedback.type === 'correct') return;
    if (key === 'backspace') {
      setInputAnswer((prev) => prev.slice(0, -1));
    } else if (key === 'clear') {
      setInputAnswer('');
    } else {
      if (inputAnswer.length < 7) {
        setInputAnswer((prev) => prev + key);
      }
    }
  };

  // Submit Answer
  const handleSubmitAnswer = (answerToVerify?: string) => {
    const rawAnswer = answerToVerify !== undefined ? answerToVerify : inputAnswer;
    const trimmed = rawAnswer.trim();
    if (!trimmed || feedback.type === 'correct') return;

    const isCorrect = trimmed === currentProblem.answer.trim();

    if (isCorrect) {
      // Confetti effect on correct!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      const newCombo = comboCount + 1;
      setComboCount(newCombo);
      setSessionCorrect((c) => c + 1);

      // Award game rewards
      const reward = GameService.awardProblemReward(student.account.id, {
        isCorrect: true,
        difficulty: currentProblem.difficulty,
        comboCount: newCombo,
        isSpeed: isSpeedStage,
        isRetry: failCount > 0,
        stageId,
        isBoss: currentProblem.type === 'boss',
      });

      // Update student data state
      const updatedStudent = DataService.getStudentData(student.account.id);
      if (updatedStudent) {
        updatedStudent.totalCorrect += 1;
        DataService.saveStudentData(updatedStudent);
        onStudentUpdated(updatedStudent);
      }

      setFeedback({
        type: 'correct',
        message: '🎉 정답입니다! 훌륭하게 계산해 냈어요!',
        expGained: reward.expGained,
        goldGained: reward.goldGained,
        bonusMsg: reward.bonusMessage,
      });

      if (reward.isLevelUp) {
        confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
      }

      // Check if stage 15 completed
      if (currentIndex === 14) {
        handleStageClear();
      }
    } else {
      // Wrong Answer
      const newFail = failCount + 1;
      setFailCount(newFail);
      setComboCount(0);
      setSessionWrong((w) => w + 1);

      // Rule-based error diagnosis
      const diagnosedError = LearningService.diagnoseError(currentProblem, trimmed);

      // Record wrong answer in DataService
      const updatedStudent = DataService.getStudentData(student.account.id);
      if (updatedStudent) {
        updatedStudent.totalWrong += 1;
        const currentStageRec = updatedStudent.stages[stageId];
        if (currentStageRec) {
          currentStageRec.wrongCount += 1;
          currentStageRec.wrongQuestions.push({
            problemId: currentProblem.id,
            stageId,
            problem: `${currentProblem.a || ''} × ${currentProblem.b || ''} (${currentProblem.question})`,
            studentAns: trimmed,
            correctAns: currentProblem.answer,
            errorType: diagnosedError,
            retryCount: newFail,
            hintLevel: Math.min(newFail, 3),
            createdAt: new Date().toISOString(),
          });
        }
        DataService.saveStudentData(updatedStudent);
        onStudentUpdated(updatedStudent);
      }

      // Determine hint step
      setActiveHintLevel(Math.min(newFail, 3));
      setShowHintModal(true);

      let msg = '다시 한 번 차근차근 생각해 볼까요?';
      if (newFail === 2) msg = '계산 순서와 올림수를 꼼꼼히 확인해 보세요!';
      else if (newFail >= 3) msg = '단계별 시각화 힌트를 확인하고 도전하세요!';

      setFeedback({
        type: 'wrong',
        message: `❌ ${msg} (진단: ${diagnosedError})`,
      });
    }
  };

  // Google Sheets Cloud Sync Dispatcher
  const syncStageToGoogleSheets = async (targetStudent: StudentData, isClear = false) => {
    const stageRec = targetStudent.stages[stageId];
    if (!stageRec) return;

    setCloudSyncState({ status: 'saving', message: '구글 스프레드시트에 저장 중...' });

    const totalAns = stageRec.correctCount + stageRec.wrongCount;
    const acc = totalAns > 0 ? Math.round((stageRec.correctCount / totalAns) * 100) : 0;
    const primaryError = stageRec.wrongQuestions?.[0]?.errorType || '없음';

    const payload: GasStageSubmission = {
      submissionId: GasService.generateSubmissionId(targetStudent.account.id, stageId),
      submittedAt: new Date().toISOString(),
      grade: targetStudent.account.grade || 3,
      classNo: targetStudent.account.classNo || 3,
      number: targetStudent.account.number || 1,
      name: targetStudent.account.name || '학생',
      id: targetStudent.account.id,
      job: targetStudent.character.job,
      level: targetStudent.character.level,
      stageId,
      stageTitle: `${stageId}차시: ${stageInfo.title}`,
      mastery: stageRec.mastery,
      score: stageRec.score || 0,
      correctCount: stageRec.correctCount,
      wrongCount: stageRec.wrongCount,
      accuracyRate: acc,
      tryCount: stageRec.tryCount || 1,
      hintCount: stageRec.hintCount || 0,
      errorType: primaryError,
      wrongQuestions: stageRec.wrongQuestions,
      gold: targetStudent.character.gold,
      exp: targetStudent.character.exp,
      praiseStickers: targetStudent.character.praiseStickers || 0,
      remarks: isClear ? '차시 학습 정복 완료' : '학습 진행 기록',
      mode: 'update',
    };

    const res = await GasService.saveStageResult(payload);
    if (res.success) {
      setCloudSyncState({ status: 'saved', message: '구글 스프레드시트에 저장 완료되었습니다.' });
    } else {
      setCloudSyncState({
        status: 'error',
        message: res.error || '클라우드 저장 지연 (로컬에 안전하게 보관됨)',
      });
    }
  };

  // Stage Clear Handler
  const handleStageClear = () => {
    const updatedStudent = DataService.getStudentData(student.account.id);
    if (!updatedStudent) return;

    const clearRewards = GameService.awardStageClear(student.account.id, stageId);

    const stageRec = updatedStudent.stages[stageId];
    if (stageRec) {
      stageRec.completed = true;
      stageRec.correctCount += sessionCorrect + 1;
      stageRec.wrongCount += sessionWrong;
      stageRec.mastery = LearningService.calculateMastery(
        stageRec.correctCount,
        stageRec.wrongCount,
        stageRec.advancedSolved,
        stageRec.challengeSolved
      );
    }
    DataService.saveStudentData(updatedStudent);
    onStudentUpdated(updatedStudent);

    // Asynchronously dispatch to Google Apps Script
    syncStageToGoogleSheets(updatedStudent, true);

    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.6 },
    });

    setStageClearedModal({
      open: true,
      monsterUnlocked: clearRewards.monsterUnlocked,
      rareUnlocked: clearRewards.rareUnlocked,
    });
  };

  // Next Problem
  const handleNextProblem = () => {
    setFeedback({ type: null, message: '' });
    setInputAnswer('');
    setFailCount(0);
    setActiveHintLevel(0);
    setShowHintModal(false);
    setActiveSkillHighlight(false);
    setActiveMagicGrid(false);

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);

    if (nextIndex < curriculum.length) {
      setCurrentProblem(curriculum[nextIndex]);
    } else {
      // Infinite Procedural Practice mode after 15 questions!
      const procedural = LearningService.generateProceduralProblem(
        stageId,
        nextIndex + 1,
        nextIndex % 5 === 0 ? '심화' : nextIndex % 10 === 0 ? '도전' : '기본'
      );
      setCurrentProblem(procedural);
    }
  };

  // Switch to Supplementary Precursor Problem on repeated fail
  const handleSwitchToSupplementary = () => {
    const supp = LearningService.generateSupplementaryProblem(stageId, currentProblem);
    setCurrentProblem(supp);
    setInputAnswer('');
    setFailCount(0);
    setActiveHintLevel(0);
    setShowHintModal(false);
    setFeedback({
      type: null,
      message: '🌱 기초 다지기 보충 문제를 불러왔습니다. 편안하게 풀어보세요!',
    });
  };

  // Active Job Skill Usage
  const handleUseSkill = (skill: MathSkill) => {
    setActiveSkillBanner(`✨ [${skill.name}] 스킬 발동! ${skill.description}`);
    setTimeout(() => setActiveSkillBanner(null), 4000);

    if (skill.effectType === 'highlight' || skill.effectType === 'decompose') {
      setActiveSkillHighlight(true);
    } else if (skill.effectType === 'grid') {
      setActiveMagicGrid(true);
    } else if (skill.effectType === 'supplementary') {
      handleSwitchToSupplementary();
    } else if (skill.effectType === 'shield') {
      setFailCount(0);
      setFeedback({
        type: null,
        message: '🛡️ 계산 방패로 오답 페널티를 방어했습니다! 다시 풀어보세요.',
      });
    } else if (skill.effectType === 'warning') {
      setActiveHintLevel(2);
      setShowHintModal(true);
    }
  };

  // Student available skills
  const studentSkills = MATH_SKILLS.filter((s) => student.character.skills.includes(s.id));

  return (
    <div id="learning-stage-view" className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Learning Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-4 py-2.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Back button & Stage Title */}
          <div className="flex items-center gap-2.5">
            <button
              id="btn-stage-back"
              onClick={onBackToMap}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-[11px] font-bold text-sky-600 flex items-center gap-1">
                <span>{stageInfo.worldName}</span>
                <span>•</span>
                <span>{stageInfo.id}차시</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight">
                {stageInfo.title.split(': ')[1] || stageInfo.title}
              </h2>
            </div>
          </div>

          {/* Student Status Capsule */}
          <div className="flex items-center gap-3">
            {/* Combo Streak Counter */}
            {comboCount >= 2 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-500 text-white font-black rounded-xl text-xs shadow-xs animate-bounce">
                <Flame className="w-4 h-4 fill-white" />
                <span>{comboCount} 콤보!</span>
              </div>
            )}

            {/* Cloud Sync Status Indicator */}
            {cloudSyncState.status !== 'idle' && (
              <div
                title={cloudSyncState.message}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                  cloudSyncState.status === 'saving'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : cloudSyncState.status === 'saved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {cloudSyncState.status === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {cloudSyncState.status === 'saved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                {cloudSyncState.status === 'error' && <CloudAlert className="w-3.5 h-3.5 text-amber-600" />}
                <span>
                  {cloudSyncState.status === 'saving'
                    ? '시트 동기화 중...'
                    : cloudSyncState.status === 'saved'
                    ? '시트 저장 완료'
                    : '로컬 보관됨'}
                </span>
              </div>
            )}

            {/* Gold */}
            <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
              <Coins className="w-3.5 h-3.5" />
              <span>{student.character.gold}</span>
            </div>

            {/* Scratchpad Button */}
            <button
              id="btn-open-scratchpad"
              onClick={() => setIsScratchpadOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs shadow-xs active:scale-95 transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>연습장</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Problem Solving Stage Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Progress & Speed Timer Bar */}
        <div className="bg-white rounded-2xl p-3 border-2 border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-black">
              문제 {currentIndex + 1}
              {currentIndex >= 15 && ' (무한 심화 모드)'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                currentProblem.difficulty === '심화'
                  ? 'bg-purple-100 text-purple-700'
                  : currentProblem.difficulty === '도전'
                  ? 'bg-amber-100 text-amber-800'
                  : currentProblem.difficulty === '보충'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {currentProblem.difficulty}
            </span>
          </div>

          {/* Speed Timer */}
          {isSpeedStage && (
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
              <Timer className="w-4 h-4 animate-spin" />
              <span>남은 시간: {timeLeft}초</span>
              <div className="w-24 bg-rose-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-1000"
                  style={{ width: `${(timeLeft / 45) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="text-xs font-bold text-slate-500 flex items-center gap-3">
            <span className="text-emerald-600">정답 {sessionCorrect}</span>
            <span className="text-rose-500">오답 {sessionWrong}</span>
          </div>
        </div>

        {/* Skill Banner Alert */}
        {activeSkillBanner && (
          <div className="p-3 bg-gradient-to-r from-amber-400 to-sky-400 text-amber-950 font-black text-xs sm:text-sm rounded-2xl shadow-md animate-pulse text-center">
            {activeSkillBanner}
          </div>
        )}

        {/* Question Card Area */}
        <div className="bg-white rounded-3xl p-6 border-3 border-sky-400 shadow-md flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
          {/* Question Title & Prompt */}
          <div className="text-center mb-4 max-w-xl">
            <div className="text-xs font-bold text-sky-600 mb-1">{currentProblem.title}</div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-relaxed">
              {currentProblem.question}
            </h3>
          </div>

          {/* Math Equation Visualizer */}
          {currentProblem.type === 'vertical' && currentProblem.a && currentProblem.b ? (
            <div className="my-3 p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl flex flex-col items-end font-mono text-2xl sm:text-3xl font-black text-slate-800 select-none shadow-inner">
              {/* Optional Active Decompose Visualizer */}
              {activeSkillHighlight && (
                <div className="text-xs font-sans text-sky-600 font-bold mb-2 self-center">
                  💡 자릿값 분해: {currentProblem.a} = {Math.floor(currentProblem.a / 100) * 100} +{' '}
                  {Math.floor((currentProblem.a % 100) / 10) * 10} + {currentProblem.a % 10}
                </div>
              )}

              {/* Number A */}
              <div className={`tracking-widest ${activeSkillHighlight ? 'text-sky-600' : ''}`}>
                {currentProblem.a}
              </div>

              {/* Multiplication symbol and Number B */}
              <div className="flex items-center gap-4 border-b-4 border-slate-800 pb-1 w-full justify-end tracking-widest">
                <span className="text-amber-500">×</span>
                <span className={activeSkillHighlight ? 'text-indigo-600' : ''}>
                  {currentProblem.b}
                </span>
              </div>

              {/* Input or Solved Answer Display */}
              <div className="mt-2 text-sky-700 tracking-widest">
                {inputAnswer ? inputAnswer : <span className="text-slate-300">?</span>}
              </div>
            </div>
          ) : (
            <div className="my-4 p-5 bg-sky-50/60 border-2 border-sky-200 rounded-2xl flex items-center justify-center gap-3 text-2xl sm:text-3xl font-black text-slate-800 shadow-inner">
              <span>{currentProblem.a}</span>
              <span className="text-amber-500">×</span>
              <span>{currentProblem.b}</span>
              <span>=</span>
              <span className="px-4 py-1.5 bg-white border-2 border-sky-400 rounded-xl text-sky-600 min-w-[70px] text-center shadow-xs">
                {inputAnswer || '?'}
              </span>
            </div>
          )}

          {/* Multiple Choice Options if present */}
          {currentProblem.options && (
            <div className="grid grid-cols-3 gap-3 w-full max-w-md my-3">
              {currentProblem.options.map((opt) => (
                <button
                  key={opt.value}
                  id={`btn-option-${opt.value}`}
                  onClick={() => {
                    setInputAnswer(opt.value);
                    handleSubmitAnswer(opt.value);
                  }}
                  className={`py-3 px-4 rounded-xl border-2 font-black text-base transition-all ${
                    inputAnswer === opt.value
                      ? 'border-sky-500 bg-sky-500 text-white shadow-md'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Feedback Message */}
          {feedback.type && (
            <div
              className={`w-full max-w-lg p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-black animate-fade-in ${
                feedback.type === 'correct'
                  ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300 shadow-xs'
                  : 'bg-rose-50 text-rose-800 border-2 border-rose-300 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'correct' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <div>
                  <div>{feedback.message}</div>
                  {feedback.bonusMsg && (
                    <div className="text-[11px] text-amber-700 font-bold mt-0.5">
                      {feedback.bonusMsg}
                    </div>
                  )}
                </div>
              </div>

              {feedback.type === 'correct' && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-amber-600">
                    +{feedback.expGained} EXP / +{feedback.goldGained} Gold
                  </span>
                  <button
                    id="btn-next-problem"
                    onClick={handleNextProblem}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-xs active:scale-95 transition-transform flex items-center gap-1"
                  >
                    <span>다음</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input & Keypad & Skills Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left Column: Job Skills & Hint Tools */}
          <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 flex flex-col justify-between shadow-2xs space-y-3">
            <div>
              <div className="text-xs font-extrabold text-slate-700 mb-2 flex items-center justify-between">
                <span>⚡ 보유 직업 스킬</span>
                <span className="text-[10px] text-sky-600 font-bold">도움 도구</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {studentSkills.map((skill) => (
                  <button
                    key={skill.id}
                    id={`btn-skill-${skill.id}`}
                    onClick={() => handleUseSkill(skill)}
                    className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-xl text-left transition-all active:scale-95 group"
                  >
                    <span className="text-xl p-1.5 bg-white rounded-lg shadow-2xs group-hover:scale-110 transition-transform">
                      {skill.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-extrabold text-slate-800 truncate">
                        {skill.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {skill.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hint Button */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                id="btn-show-hint"
                onClick={() => setShowHintModal(true)}
                className="w-full py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
              >
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>
                  단계별 힌트 {activeHintLevel > 0 ? `(${activeHintLevel}단계 활성)` : '보기'}
                </span>
              </button>

              {failCount >= 3 && (
                <button
                  id="btn-supplementary-switch"
                  onClick={handleSwitchToSupplementary}
                  className="w-full py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <span>🌱 쉬운 보충 문제 풀기</span>
                </button>
              )}
            </div>
          </div>

          {/* Center & Right Column: Large Touch Numeric Keypad */}
          <div className="md:col-span-2 bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-2xs flex flex-col justify-between">
            {/* Input Display Row */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xl font-mono font-black text-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-sans">답안:</span>
                <span className="text-sky-600">{inputAnswer || '입력 대기'}</span>
              </div>

              <button
                id="btn-submit-answer"
                onClick={() => handleSubmitAnswer()}
                disabled={!inputAnswer || feedback.type === 'correct'}
                className={`px-6 py-3 rounded-2xl font-black text-base shadow-md transition-all flex items-center gap-1.5 active:scale-95 ${
                  inputAnswer && feedback.type !== 'correct'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>정답 확인</span>
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>

            {/* Keypad Grid (Tablet & Touch Optimized) */}
            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'backspace'].map((key) => (
                <button
                  key={key}
                  id={`keypad-btn-${key}`}
                  onClick={() => handleKeypadPress(key)}
                  className={`py-3.5 sm:py-4 rounded-2xl text-xl sm:text-2xl font-black transition-all active:scale-90 select-none shadow-xs flex items-center justify-center ${
                    key === 'clear'
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 text-base font-extrabold'
                      : key === 'backspace'
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 text-lg'
                      : 'bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-800 hover:text-sky-700'
                  }`}
                >
                  {key === 'clear' ? '지우기' : key === 'backspace' ? '⌫' : key}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Step-by-Step Conditional Hint Modal */}
      {showHintModal && (
        <div
          id="hint-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="flex flex-col w-full max-w-lg bg-white rounded-3xl shadow-2xl border-4 border-amber-400 overflow-hidden">
            <div className="px-6 py-4 bg-amber-400 text-amber-950 font-black text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                <span>단계별 맞춤 힌트</span>
              </div>
              <button
                id="btn-close-hint"
                onClick={() => setShowHintModal(false)}
                className="p-1 rounded-lg hover:bg-amber-500"
              >
                닫기
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Level 1 Hint */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all ${
                  activeHintLevel >= 1
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-amber-800">1단계: 개념 생각하기</span>
                  {activeHintLevel < 1 && (
                    <span className="text-[10px] text-slate-500 font-bold">1회 오답 시 해금</span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-700">{currentProblem.hint1}</p>
              </div>

              {/* Level 2 Hint */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all ${
                  activeHintLevel >= 2
                    ? 'bg-sky-50 border-sky-300'
                    : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-sky-800">2단계: 계산 순서 및 전략</span>
                  {activeHintLevel < 2 && (
                    <span className="text-[10px] text-slate-500 font-bold">2회 오답 시 해금</span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-700">{currentProblem.hint2}</p>
              </div>

              {/* Level 3 Hint (Visual Breakdown) */}
              <div
                className={`p-4 rounded-2xl border-2 transition-all ${
                  activeHintLevel >= 3
                    ? 'bg-purple-50 border-purple-300'
                    : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-purple-800">
                    3단계: 부분곱 & 수 모형 시각화
                  </span>
                  {activeHintLevel < 3 && (
                    <span className="text-[10px] text-slate-500 font-bold">3회 오답 시 해금</span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-700">{currentProblem.hint3.text}</p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                id="btn-hint-confirm"
                onClick={() => setShowHintModal(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                알겠습니다! 다시 풀기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Cleared Celebration Modal */}
      {stageClearedModal.open && (
        <div
          id="stage-cleared-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fade-in"
        >
          <div className="flex flex-col items-center w-full max-w-md bg-white rounded-3xl shadow-2xl border-4 border-amber-400 overflow-hidden text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-inner animate-bounce">
              🏆
            </div>

            <div>
              <h3 className="text-2xl font-black font-rpg text-slate-800">
                {stageInfo.id}차시 정복 완료!
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                대륙의 성역을 훌륭하게 클리어했습니다!
              </p>
            </div>

            {/* Unlocked Monster Box */}
            {stageClearedModal.monsterUnlocked && (
              <div className="w-full p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl text-left flex items-center gap-3">
                <span className="text-3xl">✨🦖</span>
                <div>
                  <div className="text-xs font-extrabold text-emerald-800">
                    신규 수학몬 도감 등록!
                  </div>
                  <div className="text-sm font-black text-slate-800">
                    [{stageClearedModal.monsterUnlocked}] 획득
                  </div>
                </div>
              </div>
            )}

            {/* Stage Rewards */}
            <div className="w-full p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-black text-amber-900 flex justify-around">
              <span>EXP +80</span>
              <span>Gold +50</span>
              <span>별 3개 획득 ⭐⭐⭐</span>
            </div>

            {/* Google Sheets Sync Box */}
            <div className={`w-full p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition-all ${
              cloudSyncState.status === 'saving'
                ? 'bg-sky-50 text-sky-800 border-sky-200'
                : cloudSyncState.status === 'saved'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : cloudSyncState.status === 'error'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 text-left truncate">
                {cloudSyncState.status === 'saving' && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-sky-600" />}
                {cloudSyncState.status === 'saved' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {cloudSyncState.status === 'error' && <CloudAlert className="w-4 h-4 text-amber-600 shrink-0" />}
                <span className="truncate">
                  {cloudSyncState.status === 'saving'
                    ? '구글 스프레드시트에 저장하는 중...'
                    : cloudSyncState.status === 'saved'
                    ? '구글 스프레드시트에 학습 결과가 저장되었습니다.'
                    : cloudSyncState.status === 'error'
                    ? '오프라인 저장 완료 (클라우드 전송 실패)'
                    : '학습 기록이 저장되었습니다.'}
                </span>
              </div>
              {cloudSyncState.status === 'error' && (
                <button
                  type="button"
                  onClick={() => {
                    const curr = DataService.getStudentData(student.account.id);
                    if (curr) syncStageToGoogleSheets(curr, true);
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-black shrink-0 shadow-2xs"
                >
                  재전송
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full flex gap-2 pt-2">
              <button
                id="btn-stage-clear-map"
                onClick={onBackToMap}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl text-xs transition-all"
              >
                월드맵으로
              </button>
              <button
                id="btn-stage-clear-infinite"
                onClick={() => {
                  setStageClearedModal({ open: false });
                  handleNextProblem();
                }}
                className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 text-amber-950 font-black rounded-xl text-xs shadow-md transition-all"
              >
                무한 심화 계속하기 ⚔️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scratchpad Modal */}
      <ScratchpadModal isOpen={isScratchpadOpen} onClose={() => setIsScratchpadOpen(false)} />
    </div>
  );
};
