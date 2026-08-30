import React, { useState } from 'react';
import { StudentData, StudentAiAssessment } from '../../types';
import { AiAssessmentService } from '../../services/aiAssessmentService';
import { DataService } from '../../services/dataService';
import {
  Sparkles,
  Bot,
  RefreshCw,
  Copy,
  Check,
  Edit3,
  Save,
  Download,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  FileText,
  Sliders,
  ExternalLink,
  Layers,
  Search,
} from 'lucide-react';

interface ClassAiAssessmentPanelProps {
  students: StudentData[];
  onDataChanged: () => void;
  showToast: (success: boolean, message: string) => void;
  onOpenStudentDetail?: (student: StudentData) => void;
}

const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.0-flash-001', name: 'Google Gemini 2.0 Flash (추천·초고속)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic Claude 3.5 Sonnet (고품질 문장)' },
  { id: 'openai/gpt-4o-mini', name: 'OpenAI GPT-4o-mini (균형적)' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat (정밀 분석)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B Instruct' },
];

export const ClassAiAssessmentPanel: React.FC<ClassAiAssessmentPanelProps> = ({
  students,
  onDataChanged,
  showToast,
  onOpenStudentDetail,
}) => {
  const teacherSettings = DataService.getTeacherSettings();

  // Settings state
  const [openrouterKey, setOpenrouterKey] = useState<string>(teacherSettings.openrouterApiKey || '');
  const [selectedModel, setSelectedModel] = useState<string>(
    teacherSettings.openrouterModel || 'google/gemini-2.0-flash-001'
  );
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);

  // Batch Generation State
  const [isGeneratingAll, setIsGeneratingAll] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Table Filters & Search
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'edited'>('all');

  // Editing state: studentId -> draft text
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState<string>('');

  // Single Regenerating student IDs set
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  // Copied student ID feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Stats
  const assessedCount = students.filter((s) => s.aiAssessment?.text).length;
  const unassessedCount = students.length - assessedCount;

  // Handle Save OpenRouter API Key
  const handleSaveApiSettings = () => {
    const updated = {
      ...teacherSettings,
      openrouterApiKey: openrouterKey.trim(),
      openrouterModel: selectedModel,
      updatedAt: new Date().toISOString(),
    };
    DataService.saveTeacherSettings(updated);
    showToast(true, 'OpenRouter API 설정이 저장되었습니다.');
  };

  // Test OpenRouter Connection
  const handleTestConnection = async () => {
    setIsTestingKey(true);
    try {
      const res = await AiAssessmentService.testOpenRouterConnection(openrouterKey.trim(), selectedModel);
      if (res.success) {
        showToast(true, `OpenRouter API 연결 성공! (${res.sampleOutput || '정상 응답'})`);
      } else {
        showToast(false, res.error || 'OpenRouter API 연결 실패. 키를 확인하세요.');
      }
    } catch (e: any) {
      showToast(false, `연결 테스트 중 오류: ${e.message}`);
    } finally {
      setIsTestingKey(false);
    }
  };

  // Handle Batch Generation for entire class
  const handleBatchGenerate = async () => {
    if (
      !window.confirm(
        `학급 전체 학생(${students.length}명)의 학습 데이터를 분석하여 학교생활기록부용 맞춤형 수학 평어를 일괄 생성하시겠습니까?\n(기존 작성된 평어가 있을 경우 최신 데이터로 업데이트됩니다)`
      )
    ) {
      return;
    }

    setIsGeneratingAll(true);
    setBatchProgress({ current: 0, total: students.length });

    try {
      const { success, results, successCount, failedCount, provider } =
        await AiAssessmentService.generateClassBatchAssessments(students, {
          customApiKey: openrouterKey.trim(),
          customModel: selectedModel,
          onProgress: (current, total) => {
            setBatchProgress({ current, total });
          },
        });

      if (success) {
        AiAssessmentService.saveBatchAssessments(results);
        onDataChanged();
        showToast(
          true,
          `학급 전체 ${successCount}명의 맞춤형 수학 평어가 생성되었습니다. (사용 엔진: ${provider || 'OpenRouter'})`
        );
      } else {
        showToast(false, `평어 생성 실패 (${failedCount}건 실패). 다시 시도해주세요.`);
      }
    } catch (err: any) {
      showToast(false, `일괄 생성 중 오류 발생: ${err.message || '네트워크 오류'}`);
    } finally {
      setIsGeneratingAll(false);
      setBatchProgress(null);
    }
  };

  // Handle Single Student Regenerate
  const handleRegenerateStudent = async (student: StudentData) => {
    const studentId = student.account.id;
    setRegeneratingIds((prev) => new Set(prev).add(studentId));

    try {
      const historyCount = student.aiAssessment?.history?.length || 0;
      const res = await AiAssessmentService.generateSingleAssessment(student, {
        variationIndex: historyCount + 1,
        customApiKey: openrouterKey.trim(),
        customModel: selectedModel,
      });

      if (res.success && res.assessment) {
        AiAssessmentService.saveStudentAssessment(studentId, res.assessment);
        onDataChanged();
        showToast(true, `${student.account.name} 학생의 새로운 평어가 생성되었습니다.`);
      } else {
        showToast(false, res.error || '평어 재작성에 실패했습니다.');
      }
    } catch (e: any) {
      showToast(false, `재작성 오류: ${e.message}`);
    } finally {
      setRegeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  // Copy Single Assessment
  const handleCopySingle = async (studentId: string, text: string) => {
    if (!text) {
      showToast(false, '복사할 평어가 없습니다.');
      return;
    }
    const success = await AiAssessmentService.copyToClipboard(text);
    if (success) {
      setCopiedId(studentId);
      setTimeout(() => setCopiedId(null), 2000);
      showToast(true, '생활기록부용 평어가 클립보드에 복사되었습니다.');
    }
  };

  // Copy All Assessments to Clipboard
  const handleCopyAllToClipboard = async () => {
    const textLines = students
      .map((s) => {
        const num = s.account.number;
        const name = s.account.name;
        const text = s.aiAssessment?.text || '미생성';
        return `${num}번 ${name}: ${text}`;
      })
      .join('\n\n');

    const success = await AiAssessmentService.copyToClipboard(textLines);
    if (success) {
      showToast(true, `학급 전체 ${students.length}명의 평어가 클립보드에 복사되었습니다.`);
    }
  };

  // Start Inline Edit
  const handleStartEdit = (student: StudentData) => {
    setEditingStudentId(student.account.id);
    setDraftText(student.aiAssessment?.text || '');
  };

  // Save Inline Edit
  const handleSaveEdit = (student: StudentData) => {
    if (!draftText.trim()) {
      showToast(false, '평어 내용을 입력해주세요.');
      return;
    }

    const currentAss: StudentAiAssessment = student.aiAssessment || {
      text: draftText.trim(),
      summaryTraits: '교사 직접 작성',
      generatedAt: new Date().toISOString(),
    };

    const updatedAss: StudentAiAssessment = {
      ...currentAss,
      text: draftText.trim(),
      isCustomEdited: true,
      generatedAt: new Date().toISOString(),
    };

    AiAssessmentService.saveStudentAssessment(student.account.id, updatedAss);
    setEditingStudentId(null);
    onDataChanged();
    showToast(true, `${student.account.name} 학생의 평어가 수정 저장되었습니다.`);
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setDraftText('');
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesKeyword =
      s.account.name.includes(searchKeyword) ||
      String(s.account.number).includes(searchKeyword) ||
      s.account.id.includes(searchKeyword);

    if (!matchesKeyword) return false;

    if (filterStatus === 'completed') return !!s.aiAssessment?.text;
    if (filterStatus === 'pending') return !s.aiAssessment?.text;
    if (filterStatus === 'edited') return !!s.aiAssessment?.isCustomEdited;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Overview Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 text-white p-6 sm:p-7 rounded-[28px] shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl">
                ✨
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>OpenRouter AI 학생별 수학 평어 자동 생성 센터</span>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full font-bold">
                    생활기록부 & 과정중심평가
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  12개 차시 학습 정답률, 도달 수준, 오답 분석 및 자기수정 과정, 문제 만들기 활동을 종합 분석하여 문장을 자동 생성합니다.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-300">
              <div className="px-3 py-1 bg-white/10 rounded-xl border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>생성 완료: {assessedCount}명</span>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-xl border border-white/10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>미생성: {unassessedCount}명</span>
              </div>
              <div className="px-3 py-1 bg-white/10 rounded-xl border border-white/10 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-indigo-300" />
                <span>연동 모델: {selectedModel.split('/')[1] || selectedModel}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-toggle-ai-settings"
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>API 모델 설정</span>
              {showSettingsDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              id="btn-generate-all-assessments"
              onClick={handleBatchGenerate}
              disabled={isGeneratingAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0"
            >
              {isGeneratingAll ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>학급 전체 AI 평어 일괄 생성</span>
            </button>
          </div>
        </div>

        {/* Progress Bar when Batch Generating */}
        {batchProgress && (
          <div className="mt-4 p-3 bg-white/10 rounded-2xl border border-white/15 space-y-1.5 animate-fade-in">
            <div className="flex justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>학급 학생별 학습 데이터 분석 및 평어 작성 진행 중...</span>
              </span>
              <span>
                {batchProgress.current} / {batchProgress.total}명 (
                {Math.round((batchProgress.current / batchProgress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-slate-700/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-400 to-purple-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. OpenRouter API & Model Settings Drawer */}
      {showSettingsDrawer && (
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">OpenRouter AI 엔드포인트 및 모델 환경 설정</h4>
            </div>
            <span className="text-xs text-slate-500">API 키가 없더라도 지능형 교육과정 엔진으로 즉시 생성 가능</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OpenRouter API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>OpenRouter API Key (선택)</span>
                <span className="text-[11px] font-normal text-slate-400">sk-or-v1-...</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="input-openrouter-key"
                  type="password"
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="미입력 시 환경변수 또는 Gemini 엔진 활용"
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  id="btn-test-openrouter"
                  onClick={handleTestConnection}
                  disabled={isTestingKey}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors shrink-0"
                >
                  {isTestingKey ? '확인 중...' : '연결 테스트'}
                </button>
              </div>
            </div>

            {/* Model Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">생성 모델 선택 (OpenRouter Model)</label>
              <select
                id="select-openrouter-model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              id="btn-save-ai-settings"
              onClick={handleSaveApiSettings}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
            >
              설정 저장하기
            </button>
          </div>
        </div>
      )}

      {/* 3. Filter & Export Toolbar */}
      <div className="bg-white p-4 rounded-[24px] border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="학생 이름 / 번호 검색..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'all' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              전체 ({students.length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'completed' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              생성 완료 ({assessedCount})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterStatus === 'pending' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              미생성 ({unassessedCount})
            </button>
          </div>
        </div>

        {/* Batch Export / Copy buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            id="btn-copy-all-assessments"
            onClick={handleCopyAllToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors active:scale-95"
            title="학급 전체 평어를 텍스트로 한 번에 복사합니다"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>전체 평어 복사</span>
          </button>

          <button
            id="btn-export-assessments-csv"
            onClick={() => AiAssessmentService.exportAssessmentsCSV(students)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            title="엑셀 / CSV 파일로 다운로드합니다"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* 4. Student Assessments Master Table */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-16 text-center">번호</th>
                <th className="p-3.5 w-24">이름</th>
                <th className="p-3.5 w-44">주요 학습 특성</th>
                <th className="p-3.5 min-w-[320px]">AI 수학 평어 (학교생활기록부용)</th>
                <th className="p-3.5 w-24 text-center">상태</th>
                <th className="p-3.5 w-36 text-center">관리 & 도구</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    조건에 맞는 학생이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const account = student.account;
                  const assessment = student.aiAssessment;
                  const isEditing = editingStudentId === account.id;
                  const isRegenerating = regeneratingIds.has(account.id);
                  const isCopied = copiedId === account.id;

                  // Telemetry snapshot
                  const tel = AiAssessmentService.compileStudentTelemetry(student);

                  return (
                    <tr
                      key={account.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                      id={`row-student-assessment-${account.id}`}
                    >
                      {/* Number */}
                      <td className="p-3.5 text-center font-bold text-slate-700 font-mono">
                        {account.number}번
                      </td>

                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div
                          onClick={() => onOpenStudentDetail && onOpenStudentDetail(student)}
                          className="font-bold text-slate-900 cursor-pointer hover:text-indigo-600 flex items-center gap-1.5"
                          title="학생 상세 분석 모달 열기"
                        >
                          <span>{account.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({account.id})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          정답률 {tel.accuracyRate}% · {tel.completedStagesCount}/12차시
                        </div>
                      </td>

                      {/* Summary Traits Badge */}
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                            tel.profileCategory === 'HIGH_ACCURACY_ADVANCED'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : tel.profileCategory === 'CREATIVE_PROBLEM_SOLVER'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : tel.profileCategory === 'SELF_CORRECTION_RESILIENCE'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : tel.profileCategory === 'GROWTH_IMPROVEMENT'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : tel.profileCategory === 'DIVERSE_STRATEGIES'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {assessment?.summaryTraits || tel.categoryReason}
                        </span>
                      </td>

                      {/* Assessment Text (or Inline Editor) */}
                      <td className="p-3.5">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={draftText}
                              onChange={(e) => setDraftText(e.target.value)}
                              rows={3}
                              className="w-full p-2.5 text-xs rounded-xl border border-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-100 bg-white font-sans leading-relaxed"
                              placeholder="생활기록부에 기재할 평어를 수정하세요..."
                            />
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                onClick={handleCancelEdit}
                                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs font-semibold"
                              >
                                취소
                              </button>
                              <button
                                onClick={() => handleSaveEdit(student)}
                                className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                              >
                                <Save className="w-3 h-3" />
                                <span>저장하기</span>
                              </button>
                            </div>
                          </div>
                        ) : assessment?.text ? (
                          <div className="space-y-1">
                            <p className="text-xs text-slate-800 leading-relaxed font-normal">
                              {assessment.text}
                            </p>
                            {assessment.isCustomEdited && (
                              <span className="inline-block text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                                ✍️ 교사 직접 수정됨
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            아직 평어가 생성되지 않았습니다. [생성] 버튼을 눌러주세요.
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3.5 text-center">
                        {assessment?.text ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>완료</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-medium">
                            미작성
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopySingle(account.id, assessment?.text || '')}
                            disabled={!assessment?.text}
                            title="클립보드에 평어 복사"
                            className={`p-1.5 rounded-lg border transition-all ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 disabled:opacity-30'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleStartEdit(student)}
                            title="평어 직접 수정"
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Regenerate Button */}
                          <button
                            onClick={() => handleRegenerateStudent(student)}
                            disabled={isRegenerating}
                            title="새로운 문장 구조로 다시 생성"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pedagogical Guide Note */}
      <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-[24px] text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>초등학교 학교생활기록부 교과학습발달상황 작성 안내</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          • 본 AI 수학 평어는 학생의 실제 곱셈 연산 학습 과정, 오답 수정 노력, 문제 해결 태도를 바탕으로 초등학교 생활기록부 문체에 맞춰 자동 생성된 초안입니다.
          <br />
          • 최종 기재 전 반드시 담당 교사의 확인과 검토를 거쳐 필요한 경우 [수정] 도구를 통해 수정 후 반영하시기 바랍니다.
        </p>
      </div>
    </div>
  );
};
