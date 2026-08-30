import React, { useState, useEffect } from 'react';
import { GasService, DEFAULT_GAS_URL } from '../../services/gasService';
import { DataService } from '../../services/dataService';
import { GasConnectionTestResult, GasRecord } from '../../types';
import {
  Cloud,
  CloudCheck,
  CloudAlert,
  Loader2,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  XCircle,
  ExternalLink,
  HelpCircle,
  Activity,
  Server,
  Layers,
  Database,
  ArrowRight,
} from 'lucide-react';

interface GoogleSheetsSyncPanelProps {
  onDataChanged: () => void;
  showToast: (success: boolean, message: string) => void;
}

export const GoogleSheetsSyncPanel: React.FC<GoogleSheetsSyncPanelProps> = ({
  onDataChanged,
  showToast,
}) => {
  const [gasUrl, setGasUrl] = useState<string>(GasService.getGasUrl());
  const [isUrlEditing, setIsUrlEditing] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<GasConnectionTestResult | null>(null);

  // Pull / Push operations state
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushProgress, setPushProgress] = useState<{ current: number; total: number } | null>(null);

  // Live Sheet Records Preview
  const [recentRecords, setRecentRecords] = useState<GasRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => {
    return DataService.getTeacherSettings().lastSyncedAt || null;
  });

  // Load records on mount
  useEffect(() => {
    loadRecentRecords();
  }, []);

  const loadRecentRecords = async () => {
    setIsLoadingRecords(true);
    try {
      const res = await GasService.fetchRecords();
      if (res.success && res.records) {
        setRecentRecords(res.records);
      }
    } catch (e) {
      console.warn('Failed to load recent records preview:', e);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // Run Connection Test
  const handleRunConnectionTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await GasService.testConnection(gasUrl);
      setTestResult(result);
      if (result.success) {
        showToast(true, 'Google Apps Script 연결 테스트 성공!');
        loadRecentRecords();
      } else {
        showToast(false, 'Google Apps Script 연결 테스트 실패. 진단 로그를 확인하세요.');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        status: 'failed',
        url: gasUrl,
        latencyMs: 0,
        canGet: false,
        canPost: false,
        recordCount: 0,
        message: '연결 테스트 중 예외가 발생했습니다.',
        errorDetails: err.message || String(err),
        testedAt: new Date().toISOString(),
      });
      showToast(false, '연결 테스트 중 오류 발생');
    } finally {
      setIsTesting(false);
    }
  };

  // Save URL
  const handleSaveGasUrl = () => {
    if (!gasUrl.trim().startsWith('http')) {
      showToast(false, '올바른 http/https URL을 입력해주세요.');
      return;
    }
    GasService.setGasUrl(gasUrl);
    setIsUrlEditing(false);
    showToast(true, 'Google Apps Script URL이 저장되었습니다.');
  };

  // Reset to default URL
  const handleResetToDefaultUrl = () => {
    setGasUrl(DEFAULT_GAS_URL);
    GasService.resetGasUrlToDefault();
    setIsUrlEditing(false);
    showToast(true, '기본 Apps Script URL로 복원되었습니다.');
  };

  // Pull data from Google Sheets
  const handlePullFromSheets = async () => {
    setIsPulling(true);
    try {
      const res = await GasService.fetchRecords();
      if (!res.success || !res.records) {
        showToast(false, res.error || '스프레드시트에서 데이터를 가져오지 못했습니다.');
        return;
      }

      const syncResult = GasService.syncRecordsToLocalStudents(res.records);
      setRecentRecords(res.records);
      const now = new Date().toISOString();
      setLastSyncedTime(now);
      onDataChanged();
      showToast(
        true,
        `스프레드시트 ${syncResult.totalRecordsProcessed}건의 기록을 성공적으로 동기화했습니다.`
      );
    } catch (err: any) {
      showToast(false, `동기화 실패: ${err.message || '네트워크 오류'}`);
    } finally {
      setIsPulling(false);
    }
  };

  // Push all local data to Google Sheets
  const handlePushAllToSheets = async () => {
    if (
      !window.confirm(
        '현재 브라우저에 저장된 모든 학생의 차시별 학습 기록을 구글 스프레드시트에 일괄 업로드하시겠습니까?'
      )
    ) {
      return;
    }

    setIsPushing(true);
    setPushProgress(null);
    try {
      const { successCount, failedCount } = await GasService.pushAllStudentsToGas(
        (current, total) => {
          setPushProgress({ current, total });
        }
      );

      const now = new Date().toISOString();
      setLastSyncedTime(now);
      loadRecentRecords();
      showToast(
        true,
        `스프레드시트 업로드 완료: 성공 ${successCount}건 ${failedCount > 0 ? `/ 실패 ${failedCount}건` : ''}`
      );
    } catch (err: any) {
      showToast(false, `업로드 중 오류 발생: ${err.message || '네트워크 오류'}`);
    } finally {
      setIsPushing(false);
      setPushProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Google Sheets Connection Header & Status */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center font-bold text-lg">
              📊
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Google 스프레드시트 & Apps Script 실시간 연동 센터</span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-extrabold">
                  클라우드 자동 저장
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                학생들이 태블릿에서 문제를 풀고 클리어하면 스프레드시트에 실시간으로 기록됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-gas-pull-sync"
              onClick={handlePullFromSheets}
              disabled={isPulling}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              {isPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5" />}
              <span>시트에서 최신 데이터 가져오기</span>
            </button>

            <button
              id="btn-gas-push-all"
              onClick={handlePushAllToSheets}
              disabled={isPushing}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>전체 데이터 시트로 내보내기</span>
            </button>
          </div>
        </div>

        {/* Push Progress Bar if active */}
        {pushProgress && (
          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs space-y-1.5">
            <div className="flex justify-between font-bold text-indigo-900 text-[11px]">
              <span>구글 스프레드시트로 일괄 전송 중...</span>
              <span>
                {pushProgress.current} / {pushProgress.total}건 ({Math.round((pushProgress.current / pushProgress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-200"
                style={{ width: `${(pushProgress.current / pushProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 2. Apps Script Endpoint URL Configuration */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-600" />
              <span>Apps Script 웹 앱 실행 URL</span>
            </label>
            <div className="flex items-center gap-2">
              {!isUrlEditing ? (
                <button
                  id="btn-edit-gas-url"
                  onClick={() => setIsUrlEditing(true)}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                >
                  URL 변경하기
                </button>
              ) : (
                <button
                  id="btn-reset-gas-url"
                  onClick={handleResetToDefaultUrl}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                >
                  기본 URL로 복원
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="input-gas-url"
              type="text"
              readOnly={!isUrlEditing}
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className={`flex-1 px-3 py-2 text-xs font-mono rounded-xl border transition-all ${
                isUrlEditing
                  ? 'bg-white border-indigo-400 focus:outline-hidden ring-2 ring-indigo-100'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            />

            {isUrlEditing ? (
              <button
                id="btn-save-gas-url"
                onClick={handleSaveGasUrl}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0"
              >
                저장
              </button>
            ) : (
              <button
                id="btn-run-gas-test"
                onClick={handleRunConnectionTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold rounded-xl transition-all shadow-2xs shrink-0"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                <span>연결 테스트 실행</span>
              </button>
            )}
          </div>

          {lastSyncedTime && (
            <div className="text-[11px] text-slate-400 font-medium">
              마지막 시트 동기화: {new Date(lastSyncedTime).toLocaleString()}
            </div>
          )}
        </div>

        {/* 3. Connection Test Result Diagnostics Panel */}
        {testResult && (
          <div
            id="gas-test-diagnostics"
            className={`p-4 rounded-2xl border text-xs space-y-2 animate-fade-in ${
              testResult.success
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{testResult.message}</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 bg-white/80 rounded-md border border-slate-200/50">
                응답 속도: {testResult.latencyMs}ms
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-semibold text-[11px]">
              <div className="p-2 bg-white/70 rounded-xl border border-slate-200/40">
                <span>데이터 조회 (GET): </span>
                <span className={testResult.canGet ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {testResult.canGet ? '✅ 정상 통신' : '❌ 통신 불가'}
                </span>
              </div>

              <div className="p-2 bg-white/70 rounded-xl border border-slate-200/40">
                <span>데이터 저장 (POST): </span>
                <span className={testResult.canPost ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                  {testResult.canPost ? '✅ 쓰기 가능' : '❌ 쓰기 불가'}
                </span>
              </div>

              <div className="p-2 bg-white/70 rounded-xl border border-slate-200/40">
                <span>스프레드시트 누적 행: </span>
                <span className="font-bold text-slate-800">{testResult.recordCount}건</span>
              </div>
            </div>

            {testResult.errorDetails && (
              <div className="p-2.5 bg-rose-100/80 rounded-xl text-[11px] font-mono text-rose-900 mt-2">
                <strong>에러 원인:</strong> {testResult.errorDetails}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Live Spreadsheet Submission Records Preview */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">
              구글 스프레드시트 실시간 제출 로그 ({recentRecords.length}건)
            </h4>
          </div>

          <button
            onClick={loadRecentRecords}
            disabled={isLoadingRecords}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRecords ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
            {isLoadingRecords ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span>스프레드시트에서 데이터를 조회하고 있습니다...</span>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-600">아직 스프레드시트에 등록된 제출 결과가 없습니다.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  학생들이 문제를 풀거나 위의 [전체 데이터 시트로 내보내기] 버튼을 눌러보세요.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="p-3">제출일시</th>
                  <th className="p-3">번호/이름</th>
                  <th className="p-3">차시</th>
                  <th className="p-3">성취수준</th>
                  <th className="p-3 text-center">정답/오답</th>
                  <th className="p-3 text-center">정답률</th>
                  <th className="p-3">주요오류</th>
                  <th className="p-3 text-right">보상 (골드/EXP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentRecords.slice(0, 15).map((rec, idx) => {
                  const num = rec['번호'] || '-';
                  const name = rec['이름'] || '학생';
                  const stage = rec['차시'] ? `${rec['차시']}차시` : '-';
                  const mastery = rec['성취수준'] || '기본';
                  const correct = rec['정답수'] ?? 0;
                  const wrong = rec['오답수'] ?? 0;
                  const acc = rec['정답률(%)'] ?? 0;
                  const errorType = rec['주요오류유형'] || '-';
                  const gold = rec['획득골드'] ?? 0;
                  const exp = rec['획득경험치'] ?? 0;
                  const dateStr = rec['제출일시'] ? new Date(rec['제출일시']).toLocaleTimeString() : '-';

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{dateStr}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {num}번 {name}
                      </td>
                      <td className="p-3 font-semibold text-indigo-700">{stage}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            mastery === '완전정복' || mastery === '심화'
                              ? 'bg-purple-100 text-purple-800'
                              : mastery === '기본'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {mastery}
                        </span>
                      </td>
                      <td className="p-3 text-center font-semibold">
                        <span className="text-emerald-600">{correct}</span> /{' '}
                        <span className="text-rose-600">{wrong}</span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">{acc}%</td>
                      <td className="p-3 text-slate-600 text-[11px] truncate max-w-[120px]">{errorType}</td>
                      <td className="p-3 text-right font-mono text-[11px] text-amber-700">
                        +{gold}G / +{exp}E
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Google Apps Script Setup & Deployment Helper Guide */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-[28px] shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-400 font-bold">
          <HelpCircle className="w-4 h-4" />
          <span>Google Apps Script 웹 앱 배포 안내 가이드</span>
        </div>
        <div className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
          <p>
            1. 스프레드시트 상단 메뉴의 <strong>[확장 프로그램] → [Apps Script]</strong>를 클릭하고 서버용 <code>Code.gs</code>를 붙여넣습니다.
          </p>
          <p>
            2. 우측 상단의 <strong>[배포] → [새 배포]</strong>를 클릭한 뒤, 유형을 <strong>웹 앱(Web App)</strong>으로 선택합니다.
          </p>
          <p>
            3. <strong>다음 사용자 권한으로 앱 실행:</strong> <u>나(내 계정)</u>, <strong>액세스 권한이 있는 사용자:</strong> <u>모든 사용자(Anyone)</u>로 설정 후 배포합니다.
          </p>
          <p>
            4. 생성된 웹 앱 URL (<code>.../exec</code>로 끝나는 주소)을 위의 입력창에 넣고 <strong>[연결 테스트 실행]</strong>을 진행하세요.
          </p>
        </div>
      </div>
    </div>
  );
};
