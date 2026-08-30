import React, { useState, useEffect } from 'react';
import { DataService } from '../../services/dataService';
import { AnalysisService } from '../../services/analysisService';
import { GasService } from '../../services/gasService';
import { StudentData } from '../../types';
import { STAGES_METADATA } from '../../data/gameData';
import { StudentDetailModal } from './StudentDetailModal';
import { PrintableCardsView } from './PrintableCardsView';
import { GoogleSheetsSyncPanel } from './GoogleSheetsSyncPanel';
import { ClassAiAssessmentPanel } from './ClassAiAssessmentPanel';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  AlertCircle,
  UserPlus,
  Database,
  Settings,
  Download,
  Printer,
  Search,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sparkles,
  Award,
  BookOpen,
  HelpCircle,
  KeyRound,
  Shield,
  Zap,
  Cloud,
  CloudCheck,
  CloudAlert,
  Loader2,
} from 'lucide-react';

interface TeacherDashboardProps {
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'stages' | 'students' | 'assessment' | 'sos' | 'gas' | 'accounts' | 'data' | 'settings'
  >('overview');

  // Trigger state for updates
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const handleDataRefresh = () => setRefreshKey((prev) => prev + 1);

  // Real-time Cloud Sync State
  const [isSyncingSheets, setIsSyncingSheets] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return DataService.getTeacherSettings().lastSyncedAt || null;
  });

  // Selected student for detail popup
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

  // Print cards view mode
  const [showPrintView, setShowPrintView] = useState<boolean>(false);

  // Search and sort for students table
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'level' | 'accuracy' | 'progress'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // New Student Single Add Form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [newStudentJob, setNewStudentJob] = useState<'warrior' | 'wizard' | 'healer' | 'explorer'>('warrior');

  // Bulk Generate Form
  const [bulkCount, setBulkCount] = useState<number>(20);

  // Change Teacher Password Form
  const [currTeacherPw, setCurrTeacherPw] = useState('');
  const [newTeacherPw, setNewTeacherPw] = useState('');
  const [confirmTeacherPw, setConfirmTeacherPw] = useState('');
  const [pwChangeAlert, setPwChangeAlert] = useState<{ success: boolean; message: string } | null>(null);

  // Data Actions Alert
  const [actionAlert, setActionAlert] = useState<{ success: boolean; message: string } | null>(null);

  const showActionAlert = (success: boolean, message: string) => {
    setActionAlert({ success, message });
    setTimeout(() => setActionAlert(null), 3500);
  };

  // Initial Sync from Google Apps Script on mount
  useEffect(() => {
    handlePullLatestFromGas(true);
  }, []);

  const handlePullLatestFromGas = async (silent = false) => {
    setIsSyncingSheets(true);
    try {
      const res = await GasService.fetchRecords();
      if (res.success && res.records && res.records.length > 0) {
        const syncRes = GasService.syncRecordsToLocalStudents(res.records);
        const now = new Date().toISOString();
        setLastSyncTime(now);
        handleDataRefresh();
        if (!silent) {
          showActionAlert(true, `스프레드시트에서 ${syncRes.totalRecordsProcessed}건의 학습 기록을 동기화했습니다.`);
        }
      } else if (!silent) {
        showActionAlert(true, '스프레드시트와 정상 연결되었습니다. (새로운 변경사항 없음)');
      }
    } catch (e: any) {
      if (!silent) {
        showActionAlert(false, `시트 동기화 실패: ${e.message || '네트워크 상태 확인 필요'}`);
      }
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Data fetching
  const students = AnalysisService.getStudents();
  const overview = AnalysisService.getClassOverview();
  const stageAnalysis = AnalysisService.getStageAnalysis();
  const top3Vulnerable = AnalysisService.getTop3VulnerableStages();
  const errorDistribution = AnalysisService.getErrorTypeBreakdown();
  const sosStudents = AnalysisService.getSosStudents();

  // CSV Exporters
  const handleDownloadAccountsCSV = () => {
    const csvData = AnalysisService.generateAccountsCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `수학RPG_학생계정목록_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadLearningCSV = () => {
    const csvData = AnalysisService.generateLearningDataCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `수학RPG_학습분석종합_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Single Add Student Handler
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentNumber.trim()) {
      showActionAlert(false, '학생 이름과 번호를 모두 입력해 주세요.');
      return;
    }

    const num = parseInt(newStudentNumber.trim(), 10);
    if (isNaN(num) || num <= 0) {
      showActionAlert(false, '올바른 출석 번호를 입력해 주세요.');
      return;
    }

    const paddedNum = num.toString().padStart(2, '0');
    const studentId = `3-3-${paddedNum}`;

    if (DataService.getStudentData(studentId)) {
      showActionAlert(false, `이미 ${studentId} 아이디를 가진 학생이 존재합니다.`);
      return;
    }

    DataService.createStudent({
      number: num,
      name: newStudentName.trim(),
      id: studentId,
      password: '1234',
      job: newStudentJob,
    });

    setNewStudentName('');
    setNewStudentNumber('');
    handleDataRefresh();
    showActionAlert(true, `${newStudentName} 학생 계정(${studentId})을 생성했습니다.`);
  };

  // Bulk Add Handler
  const handleBulkGenerate = () => {
    DataService.bulkCreateStudents(bulkCount);
    handleDataRefresh();
    showActionAlert(true, `${bulkCount}명의 학생 계정을 일괄 생성했습니다. (초기 비밀번호: 1234)`);
  };

  // Data Seed & Reset Handlers
  const handleSeedDemo = () => {
    DataService.seedDemoClassData();
    handleDataRefresh();
    showActionAlert(true, '20명의 3학년 3반 데모 학생 데이터와 학습 기록을 세팅했습니다.');
  };

  const handleResetLearningOnly = () => {
    if (window.confirm('정말 모든 학생의 학습 기록만 초기화하시겠습니까? (계정은 유지됩니다)')) {
      DataService.resetLearningDataOnly();
      handleDataRefresh();
      showActionAlert(true, '모든 학생의 학습 기록, 경험치, 골드가 초기화되었습니다.');
    }
  };

  const handleResetAll = () => {
    if (window.confirm('경고: 모든 학생 계정과 데이터가 완전히 삭제되고 기본 상태로 복원됩니다. 계속하시겠습니까?')) {
      DataService.resetAllData();
      handleDataRefresh();
      showActionAlert(true, '전체 데이터가 초기 상태로 리셋되었습니다.');
    }
  };

  // Change Password Handler
  const handleChangeTeacherPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwChangeAlert(null);

    if (!DataService.verifyTeacherPassword(currTeacherPw)) {
      setPwChangeAlert({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
      return;
    }

    if (newTeacherPw.length < 4) {
      setPwChangeAlert({ success: false, message: '새 비밀번호는 최소 4자 이상이어야 합니다.' });
      return;
    }

    if (newTeacherPw !== confirmTeacherPw) {
      setPwChangeAlert({ success: false, message: '새 비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    DataService.setTeacherPassword(newTeacherPw);
    setCurrTeacherPw('');
    setNewTeacherPw('');
    setConfirmTeacherPw('');
    setPwChangeAlert({ success: true, message: '교사용 비밀번호가 성공적으로 변경되었습니다.' });
  };

  // Filtered & Sorted Students
  const filteredStudents = students.filter((s) => {
    const keyword = searchKeyword.toLowerCase();
    return (
      s.account.name.toLowerCase().includes(keyword) ||
      s.account.id.toLowerCase().includes(keyword) ||
      s.account.number.toString().includes(keyword)
    );
  });

  filteredStudents.sort((a, b) => {
    let comp = 0;
    if (sortBy === 'number') {
      comp = a.account.number - b.account.number;
    } else if (sortBy === 'name') {
      comp = a.account.name.localeCompare(b.account.name);
    } else if (sortBy === 'level') {
      comp = a.character.level - b.character.level;
    } else if (sortBy === 'accuracy') {
      const aTotal = a.totalCorrect + a.totalWrong;
      const bTotal = b.totalCorrect + b.totalWrong;
      const aAcc = aTotal > 0 ? a.totalCorrect / aTotal : 0;
      const bAcc = bTotal > 0 ? b.totalCorrect / bTotal : 0;
      comp = aAcc - bAcc;
    } else if (sortBy === 'progress') {
      const aDone = Object.values(a.stages).filter((st) => st.completed).length;
      const bDone = Object.values(b.stages).filter((st) => st.completed).length;
      comp = aDone - bDone;
    }
    return sortOrder === 'asc' ? comp : -comp;
  });

  if (showPrintView) {
    return <PrintableCardsView students={students} onBack={() => setShowPrintView(false)} />;
  }

  return (
    <div id="teacher-dashboard" className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* 1. Sleek Dark Sidebar */}
      <aside className="w-full md:w-64 bg-[#0F172A] flex flex-col shrink-0 border-r border-slate-800/80">
        {/* Brand Header */}
        <div className="p-6 pb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 flex items-center justify-center text-white text-base">
              ⚔️
            </div>
            <div>
              <div className="text-white font-bold text-base tracking-tight flex items-center gap-1">
                <span>수학 RPG</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-semibold rounded-md border border-indigo-500/30">초3-2</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">곱셈 마스터 교사 포털</div>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3.5 space-y-1">
          {[
            { id: 'overview', name: '학급 종합 현황', icon: LayoutDashboard },
            { id: 'stages', name: '12개 차시별 분석', icon: BarChart3 },
            { id: 'students', name: '학생별 성장 기록', icon: Users },
            {
              id: 'assessment',
              name: 'AI 수학 평어 생성',
              icon: Sparkles,
              badge: students.filter((s) => s.aiAssessment?.text).length,
              badgeColor: 'emerald',
            },
            { id: 'sos', name: 'SOS 집중 지도', icon: AlertCircle, badge: sosStudents.length },
            { id: 'gas', name: '스프레드시트 연동', icon: Cloud },
            { id: 'accounts', name: '학생 계정 관리', icon: UserPlus },
            { id: 'data', name: '데이터 & 시드 관리', icon: Database },
            { id: 'settings', name: '교사 관리 설정', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-xs border border-slate-700/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'opacity-70'}`} />
                  <span>{tab.name}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      tab.badgeColor === 'emerald'
                        ? isActive
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isActive
                        ? 'bg-rose-500 text-white'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Progress Widget */}
        <div className="p-4 mt-auto">
          <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">학급 전체 진도율</span>
              <span className="text-indigo-300 font-bold">{overview.avgProgress}%</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-400 to-purple-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${overview.avgProgress}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
              <span>총 {overview.totalStudents}명 학생 참여 중</span>
              <span className="text-slate-300 font-semibold">12차시</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Content View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Sleek Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-20 shadow-2xs">
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {activeTab === 'overview' && '학급 현황 종합 대시보드'}
              {activeTab === 'stages' && '1~12차시 단원 성취도 및 오답 분석'}
              {activeTab === 'students' && '개별 학생 성장 및 학습 로그'}
              {activeTab === 'assessment' && 'AI 학생별 맞춤형 수학 평어 생성 센터'}
              {activeTab === 'sos' && 'SOS 취약 학생 맞춤 피드백 센터'}
              {activeTab === 'gas' && 'Google 스프레드시트 & Apps Script 실시간 연동 센터'}
              {activeTab === 'accounts' && '학생 계정 발급 및 인쇄 관리'}
              {activeTab === 'data' && '학습 데이터 백업 & 시드 환경'}
              {activeTab === 'settings' && '교사용 보안 및 관리자 설정'}
            </h2>
            <div className="flex items-center text-[11px] text-slate-400 gap-1.5 font-medium">
              <span>초등 3학년 2학기</span>
              <span className="text-[10px]">/</span>
              <span>1단원 곱셈 (12차시)</span>
              <span className="text-[10px]">/</span>
              <span className="text-slate-600 font-semibold">3학년 3반</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Real-time Google Sheets Sync Button */}
            <button
              id="btn-teacher-sync-gas"
              onClick={() => handlePullLatestFromGas(false)}
              disabled={isSyncingSheets}
              title={lastSyncTime ? `마지막 동기화: ${new Date(lastSyncTime).toLocaleTimeString()}` : '스프레드시트 최신 데이터 동기화'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-bold rounded-xl text-xs transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span>{isSyncingSheets ? '시트 동기화 중...' : '시트 실시간 동기화'}</span>
            </button>

            {/* Quick Actions */}
            <button
              id="btn-teacher-export-csv"
              onClick={handleDownloadLearningCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 font-semibold rounded-xl text-xs transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>학습 분석 CSV</span>
            </button>

            <button
              id="btn-teacher-print-cards"
              onClick={() => setShowPrintView(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 border border-indigo-200/60 font-semibold rounded-xl text-xs transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-600" />
              <span>계정 카드 인쇄</span>
            </button>

            <button
              id="btn-teacher-logout"
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-colors shadow-2xs ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>
          </div>
        </header>

        {/* Inner Scrollable Workspace */}
        <main className="flex-1 p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Action Notification Alert */}
          {actionAlert && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs transition-all ${
                actionAlert.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}
            >
              {actionAlert.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{actionAlert.message}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* Metric Cards Grid - Matching Sleek Interface style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-[24px] border border-slate-200/70 shadow-xs hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-emerald-600 text-xs font-bold px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                      정답률
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs font-medium mb-1">학급 평균 정답률</div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{overview.avgAccuracy}%</div>
                  <div className="text-[11px] text-slate-400 mt-1">총 {overview.totalStudents}명 응시 데이터</div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-200/70 shadow-xs hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                      <Zap className="w-5 h-5" />
                    </div>
                    <span className="text-indigo-600 text-xs font-bold px-2.5 py-1 bg-indigo-50 rounded-full border border-indigo-100">
                      12차시
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs font-medium mb-1">단원 평균 진도율</div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{overview.avgProgress}%</div>
                  <div className="text-[11px] text-slate-400 mt-1">스테이지 클리어 기준</div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-200/70 shadow-xs hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-amber-600 text-xs font-bold px-2.5 py-1 bg-amber-50 rounded-full border border-amber-100">
                      성장 지표
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs font-medium mb-1">평균 캐릭터 레벨</div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">Lv.{overview.avgLevel}</div>
                  <div className="text-[11px] text-slate-400 mt-1">평균 {overview.avgExp} EXP 획득</div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-200/70 shadow-xs hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="text-purple-600 text-xs font-bold px-2.5 py-1 bg-purple-50 rounded-full border border-purple-100">
                      도감 수집
                    </span>
                  </div>
                  <div className="text-slate-500 text-xs font-medium mb-1">수학몬 수집률</div>
                  <div className="text-2xl font-bold text-slate-900 tracking-tight">{overview.monsterCollectionRate}%</div>
                  <div className="text-[11px] text-slate-400 mt-1">12종 정령 및 전설 보스</div>
                </div>
              </div>

              {/* Class Distributions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mastery Distribution */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-200/70 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-sm text-slate-900">학급 종합 성취도 분포</h3>
                    <span className="text-xs text-slate-400">총 {overview.totalStudents}명</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1 text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                          심화 / 완전정복 (정답률 80% 이상)
                        </span>
                        <span className="font-bold text-purple-700">{overview.masteryDistribution.advanced}명</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(overview.masteryDistribution.advanced / (overview.totalStudents || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1 text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          기본 수준 (정답률 50~79%)
                        </span>
                        <span className="font-bold text-indigo-700">{overview.masteryDistribution.basic}명</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(overview.masteryDistribution.basic / (overview.totalStudents || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1 text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          보충 필요 (정답률 50% 미만)
                        </span>
                        <span className="font-bold text-rose-700">{overview.masteryDistribution.supplementary}명</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(overview.masteryDistribution.supplementary / (overview.totalStudents || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Job Distribution */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-200/70 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-sm text-slate-900">학생 직업 선택 현황</h3>
                    <span className="text-xs text-slate-400">4대 클래스</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div className="p-3.5 bg-rose-50/60 border border-rose-200/60 rounded-2xl flex items-center justify-between">
                      <span className="text-slate-800">⚔️ 전사</span>
                      <span className="text-rose-600 font-bold bg-white px-2 py-0.5 rounded-lg border border-rose-200">
                        {overview.jobDistribution.warrior}명
                      </span>
                    </div>
                    <div className="p-3.5 bg-indigo-50/60 border border-indigo-200/60 rounded-2xl flex items-center justify-between">
                      <span className="text-slate-800">🔮 마법사</span>
                      <span className="text-indigo-600 font-bold bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                        {overview.jobDistribution.wizard}명
                      </span>
                    </div>
                    <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl flex items-center justify-between">
                      <span className="text-slate-800">💖 힐러</span>
                      <span className="text-emerald-600 font-bold bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                        {overview.jobDistribution.healer}명
                      </span>
                    </div>
                    <div className="p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-2xl flex items-center justify-between">
                      <span className="text-slate-800">🏹 탐험가</span>
                      <span className="text-amber-600 font-bold bg-white px-2 py-0.5 rounded-lg border border-amber-200">
                        {overview.jobDistribution.explorer}명
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Assessment Quick Card in Overview */}
              <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-[28px] border border-indigo-700/50 shadow-md flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="space-y-1.5 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>OpenRouter AI 수학 맞춤 평어</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    학습 데이터 기반 학생별 성장 지향 수학 평어 자동 생성
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    12개 차시 정답률, 문제 해결 시도, 오답 수정 과정, 탐정·퍼즐·보스 도전 활동 및 학생 성향을 다각도로 분석하여 맞춤 평어를 1~2문장으로 도출합니다.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <div className="text-center sm:text-right px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[11px] text-slate-400">평어 작성 완료</div>
                    <div className="text-base font-bold text-emerald-400">
                      {students.filter((s) => s.aiAssessment?.text).length} / {students.length}명
                    </div>
                  </div>

                  <button
                    id="btn-goto-assessment-from-overview"
                    onClick={() => setActiveTab('assessment')}
                    className="px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-2xl text-xs shadow-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>평어 센터 바로가기</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STAGES ANALYSIS */}
          {activeTab === 'stages' && (
            <div className="space-y-6 animate-fade-in">
              {/* Top 3 Vulnerable Stages Alert Box */}
              <div className="bg-gradient-to-r from-rose-50/70 via-amber-50/60 to-orange-50/50 p-6 rounded-[28px] border border-rose-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 text-sm font-bold text-rose-900">
                  <div className="p-1.5 bg-rose-500 text-white rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span>학급 최다 오답 취약 차시 TOP 3 및 맞춤 지도 가이드</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {top3Vulnerable.map((vuln, idx) => (
                    <div
                      key={vuln.stageId}
                      className="bg-white p-5 rounded-[22px] border border-rose-200/60 shadow-xs text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-rose-100/80 text-rose-800 font-bold rounded-full text-[11px]">
                          {idx + 1}위: {vuln.stageId}차시
                        </span>
                        <span className="font-bold text-rose-600">오답률 {vuln.errorRate}%</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{vuln.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        주요 오류: <strong className="text-rose-700 font-semibold">{vuln.primaryErrorType}</strong>
                      </p>
                      <div className="text-[11px] text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70 mt-2 leading-relaxed">
                        💡 <strong className="text-indigo-900 font-semibold">지도 팁:</strong> {vuln.pedagogicalAdvice}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 12 Stage Comprehensive Table */}
              <div className="bg-white rounded-[28px] border border-slate-200/70 overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center justify-between">
                  <span>1~12차시별 상세 학습 분석</span>
                  <span className="text-xs text-slate-400 font-normal">총 12개 스테이지</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/70 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3.5">차시</th>
                        <th className="p-3.5">단원 주제</th>
                        <th className="p-3.5">이수율</th>
                        <th className="p-3.5">평균 정답률</th>
                        <th className="p-3.5">평균 재시도</th>
                        <th className="p-3.5">평균 힌트</th>
                        <th className="p-3.5">수준 분포 (완전/심화/기본/보충)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stageAnalysis.map((st) => (
                        <tr key={st.stageId} className="hover:bg-slate-50/60 font-medium transition-colors">
                          <td className="p-3.5 font-bold text-indigo-600">{st.stageId}차시</td>
                          <td className="p-3.5 font-semibold text-slate-900">{st.title}</td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800">{st.completionRate}%</span>
                            <span className="text-[10px] text-slate-400 ml-1 font-normal">
                              ({st.completedCount}명)
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                st.accuracyRate >= 80
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                  : st.accuracyRate >= 50
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                              }`}
                            >
                              {st.accuracyRate}%
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-600">{st.avgRetries}회</td>
                          <td className="p-3.5 text-slate-600">{st.avgHints}회</td>
                          <td className="p-3.5">
                            <span className="text-purple-600 font-bold">{st.masteryCount}</span> /{' '}
                            <span className="text-indigo-600 font-bold">{st.advancedCount}</span> /{' '}
                            <span className="text-slate-600 font-bold">{st.basicCount}</span> /{' '}
                            <span className="text-rose-600 font-bold">{st.supplementaryCount}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error Types Breakdown */}
              <div className="bg-white p-6 rounded-[28px] border border-slate-200/70 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">오답 원인별 발생 빈도 현황</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {Object.entries(errorDistribution).map(([type, count]) => (
                    <div
                      key={type}
                      className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs flex items-center justify-between hover:bg-slate-100/60 transition-colors"
                    >
                      <span className="font-semibold text-slate-800">{type}</span>
                      <span className="font-bold text-rose-600 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                        {count}회
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STUDENTS GROWTH */}
          {activeTab === 'students' && (
            <div className="space-y-5 animate-fade-in">
              {/* Filter and Search Bar */}
              <div className="bg-white p-4 sm:p-5 rounded-[24px] border border-slate-200/70 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div className="relative flex-1 min-w-[220px] max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-search-student"
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="학생 이름 또는 번호, 아이디 검색..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <span className="text-slate-400">정렬 기준:</span>
                  <select
                    id="select-sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 font-semibold focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="number">출석번호순</option>
                    <option value="name">이름순</option>
                    <option value="level">레벨순</option>
                    <option value="accuracy">정답률순</option>
                    <option value="progress">진도율순</option>
                  </select>

                  <button
                    id="btn-toggle-sort-order"
                    onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                  >
                    {sortOrder === 'asc' ? '▲ 오름차순' : '▼ 내림차순'}
                  </button>

                  <button
                    id="btn-shortcut-ai-assessment"
                    onClick={() => setActiveTab('assessment')}
                    className="px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI 평어 일괄 생성</span>
                  </button>
                </div>
              </div>

              {/* Students Table */}
              <div className="bg-white rounded-[28px] border border-slate-200/70 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/70 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="p-3.5">번호</th>
                        <th className="p-3.5">이름 (아이디)</th>
                        <th className="p-3.5">직업 / 레벨</th>
                        <th className="p-3.5">완료 차시</th>
                        <th className="p-3.5">정답률</th>
                        <th className="p-3.5">보유 골드</th>
                        <th className="p-3.5">칭찬 스티커</th>
                        <th className="p-3.5 text-right">상세 분석</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((st) => {
                        const totalSolved = st.totalCorrect + st.totalWrong;
                        const acc = totalSolved > 0 ? Math.round((st.totalCorrect / totalSolved) * 100) : 0;
                        const completedCount = Object.values(st.stages).filter((s) => s.completed).length;

                        return (
                          <tr key={st.account.id} className="hover:bg-slate-50/70 font-medium transition-colors">
                            <td className="p-3.5 font-bold text-slate-500">{st.account.number}번</td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900">{st.account.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{st.account.id}</div>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                                <span>
                                  {st.character.job === 'warrior'
                                    ? '⚔️ 전사'
                                    : st.character.job === 'wizard'
                                    ? '🔮 마법사'
                                    : st.character.job === 'healer'
                                    ? '💖 힐러'
                                    : '🏹 탐험가'}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200/60">
                                  Lv.{st.character.level}
                                </span>
                              </div>
                            </td>
                            <td className="p-3.5 font-semibold text-slate-800">{completedCount} / 12 차시</td>
                            <td className="p-3.5">
                              <span
                                className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                                  acc >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                    : acc >= 50
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                }`}
                              >
                                {acc}%
                              </span>
                            </td>
                            <td className="p-3.5 text-amber-700 font-bold">{st.character.gold} G</td>
                            <td className="p-3.5 text-rose-600 font-bold">
                              ⭐ {st.character.praiseStickers || 0}개
                            </td>
                            <td className="p-3.5 text-right">
                              <button
                                id={`btn-view-student-${st.account.id}`}
                                onClick={() => setSelectedStudent(st)}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-2xs active:scale-95 transition-all"
                              >
                                분석 및 보상
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AI ASSESSMENT CENTER */}
          {activeTab === 'assessment' && (
            <div className="animate-fade-in">
              <ClassAiAssessmentPanel
                students={students}
                onDataChanged={handleDataRefresh}
                showToast={(success, msg) => showActionAlert(success, msg)}
                onOpenStudentDetail={(st) => setSelectedStudent(st)}
              />
            </div>
          )}

          {/* TAB 4: SOS STUDENTS */}
          {activeTab === 'sos' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-rose-50/70 border border-rose-200 p-6 rounded-[28px] text-xs space-y-2">
                <div className="flex items-center gap-2.5 text-sm font-bold text-rose-900">
                  <div className="p-1.5 bg-rose-500 text-white rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <span>SOS 집중 개별 지도 대상 학생 ({sosStudents.length}명)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  다회차 오답, 힌트 과다 사용, 학급 평균 대비 정답률 저하 등 복합 지표를 기준으로 자동 감지된 맞춤형 지도 필요 대상군입니다.
                </p>
              </div>

              {sosStudents.length === 0 ? (
                <div className="p-16 bg-white rounded-[28px] border border-slate-200/70 text-center text-xs font-semibold text-slate-400">
                  현재 집중 지도가 필요한 위험군 학생이 없습니다. 학급 전체가 순조롭게 학습 중입니다!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {sosStudents.map((sos) => (
                    <div
                      key={sos.student.account.id}
                      className="bg-white p-6 rounded-[28px] border border-rose-200/80 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div>
                        {/* Student Name & Risk Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-slate-900">
                              {sos.student.account.name} ({sos.student.account.number}번)
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {sos.student.account.id}
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200">
                            위험도 {sos.riskScore.toFixed(1)}점
                          </span>
                        </div>

                        {/* Reasons */}
                        <div className="space-y-1.5 my-3">
                          {sos.reasons.map((r, i) => (
                            <div
                              key={i}
                              className="text-[11px] font-semibold text-rose-700 bg-rose-50/60 px-3 py-1.5 rounded-xl border border-rose-100"
                            >
                              • {r}
                            </div>
                          ))}
                        </div>

                        {/* Recommended Action */}
                        <div className="mt-4 p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs">
                          <div className="font-bold text-indigo-900 mb-1">
                            💡 추천 개별 지도 방안:
                          </div>
                          <p className="text-slate-700 text-[11px] leading-relaxed">
                            {sos.recommendedAction}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedStudent(sos.student)}
                        className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-xs active:scale-95 transition-all"
                      >
                        상세 오답 로그 확인 & 맞춤 격려 보상
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ACCOUNTS MANAGEMENT */}
          {activeTab === 'accounts' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Single Add Form */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-200/70 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <span>개별 학생 신규 등록</span>
                  </h3>

                  <form onSubmit={handleAddSingleStudent} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">출석 번호</label>
                      <input
                        id="input-new-student-num"
                        type="number"
                        min={1}
                        max={99}
                        value={newStudentNumber}
                        onChange={(e) => setNewStudentNumber(e.target.value)}
                        placeholder="예: 21"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">학생 이름</label>
                      <input
                        id="input-new-student-name"
                        type="text"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        placeholder="예: 홍길동"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">초기 직업</label>
                      <select
                        id="select-new-student-job"
                        value={newStudentJob}
                        onChange={(e) => setNewStudentJob(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                      >
                        <option value="warrior">⚔️ 전사</option>
                        <option value="wizard">🔮 마법사</option>
                        <option value="healer">💖 힐러</option>
                        <option value="explorer">🏹 탐험가</option>
                      </select>
                    </div>

                    <button
                      id="btn-add-single-student"
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all active:scale-95"
                    >
                      학생 계정 생성 (초기 비밀번호: 1234)
                    </button>
                  </form>
                </div>

                {/* Bulk Generate Form */}
                <div className="bg-white p-6 rounded-[28px] border border-slate-200/70 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>학급 일괄 계정 생성 (번호 순서 자동 생성)</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    원하는 인원수를 지정하면 출석번호와 기본 이름(1번 학생 ~ N번 학생)으로 일괄 발급됩니다.
                  </p>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">생성할 학생 수 (명)</label>
                      <input
                        id="input-bulk-count"
                        type="number"
                        min={1}
                        max={40}
                        value={bulkCount}
                        onChange={(e) => setBulkCount(parseInt(e.target.value, 10) || 20)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <button
                      id="btn-bulk-create"
                      onClick={handleBulkGenerate}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs transition-all active:scale-95"
                    >
                      {bulkCount}명 일괄 계정 자동 생성
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex gap-2.5">
                    <button
                      id="btn-export-accounts-csv"
                      onClick={handleDownloadAccountsCSV}
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>계정 목록 CSV</span>
                    </button>
                    <button
                      id="btn-open-print-cards"
                      onClick={() => setShowPrintView(true)}
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-indigo-200/80 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>배부용 카드 인쇄</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GOOGLE SHEETS & APPS SCRIPT SYNC */}
          {activeTab === 'gas' && (
            <div className="animate-fade-in">
              <GoogleSheetsSyncPanel
                onDataChanged={handleDataRefresh}
                showToast={showActionAlert}
              />
            </div>
          )}

          {/* TAB 6: DATA MANAGEMENT */}
          {activeTab === 'data' && (
            <div className="space-y-5 animate-fade-in">
              {/* Google Sheets Quick Banner */}
              <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-6 rounded-[28px] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h3 className="text-sm font-bold text-emerald-300">Google 스프레드시트 실시간 클라우드 연동</h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    전체 학생의 1~12차시 학습 제출 기록을 구글 스프레드시트와 실시간으로 주고받고 백업할 수 있습니다.
                  </p>
                </div>
                <button
                  id="btn-goto-gas-tab"
                  onClick={() => setActiveTab('gas')}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all shrink-0 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>스프레드시트 연동 센터 열기</span>
                </button>
              </div>

              <div className="bg-white p-6 rounded-[28px] border border-slate-200/70 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>데이터 백업 & 시드 & 초기화 도구</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Demo Seed */}
                  <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="font-bold text-indigo-950 mb-1">체험용 20명 데모 데이터 주입</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        다양한 직업, 레벨(1~18), 실제 학생 수준별 정답/오답/오류 유형이 골고루 포함된 시드 데이터로 즉시 교사용 대시보드를 테스트합니다.
                      </p>
                    </div>
                    <button
                      id="btn-seed-demo"
                      onClick={handleSeedDemo}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs active:scale-95 transition-all"
                    >
                      데모 20명 데이터 생성 🚀
                    </button>
                  </div>

                  {/* Reset Learning Data Only */}
                  <div className="p-5 bg-amber-50/50 border border-amber-200/70 rounded-2xl text-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="font-bold text-amber-950 mb-1">학습 기록만 초기화</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        학생 계정(아이디, 비번, 이름)은 그대로 유지하고 스테이지 진도, EXP, 오답 로그만 0으로 초기화합니다.
                      </p>
                    </div>
                    <button
                      id="btn-reset-learning"
                      onClick={handleResetLearningOnly}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl shadow-xs active:scale-95 transition-all"
                    >
                      학습 기록만 초기화 🔄
                    </button>
                  </div>

                  {/* Reset All */}
                  <div className="p-5 bg-rose-50/50 border border-rose-200/70 rounded-2xl text-xs flex flex-col justify-between space-y-3">
                    <div>
                      <div className="font-bold text-rose-950 mb-1">전체 데이터 완전 리셋</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        모든 학생 계정과 학습 기록을 삭제하고 기본 3명 초기 상태로 되돌립니다.
                      </p>
                    </div>
                    <button
                      id="btn-reset-all"
                      onClick={handleResetAll}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow-xs active:scale-95 transition-all"
                    >
                      전체 데이터 삭제 ⚠️
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fade-in max-w-md">
              <div className="bg-white p-6 rounded-[28px] border border-slate-200/70 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>교사용 관리자 비밀번호 변경</span>
                </h3>

                {pwChangeAlert && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      pwChangeAlert.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border border-rose-300'
                    }`}
                  >
                    <span>{pwChangeAlert.message}</span>
                  </div>
                )}

                <form onSubmit={handleChangeTeacherPassword} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">현재 비밀번호</label>
                    <input
                      id="input-curr-teacher-pw"
                      type="password"
                      value={currTeacherPw}
                      onChange={(e) => setCurrTeacherPw(e.target.value)}
                      placeholder="현재 비밀번호 (기본: 0000)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">새 비밀번호 (최소 4자)</label>
                    <input
                      id="input-new-teacher-pw"
                      type="password"
                      value={newTeacherPw}
                      onChange={(e) => setNewTeacherPw(e.target.value)}
                      placeholder="새 비밀번호 입력"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">새 비밀번호 확인</label>
                    <input
                      id="input-confirm-teacher-pw"
                      type="password"
                      value={confirmTeacherPw}
                      onChange={(e) => setConfirmTeacherPw(e.target.value)}
                      placeholder="새 비밀번호 재입력"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <button
                    id="btn-save-teacher-pw"
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all active:scale-95"
                  >
                    비밀번호 저장
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Student Detail Modal Popup */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onStudentUpdated={() => {
            handleDataRefresh();
            const refreshed = DataService.getStudentData(selectedStudent.account.id);
            if (refreshed) setSelectedStudent(refreshed);
          }}
        />
      )}
    </div>
  );
};
