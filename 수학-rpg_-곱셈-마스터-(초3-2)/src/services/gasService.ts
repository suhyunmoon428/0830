import { DataService, createDefaultStudentProfile } from './dataService';
import { 
  StudentData, 
  GasStageSubmission, 
  GasRecord, 
  GasApiResponse, 
  GasConnectionTestResult,
  WrongQuestionRecord,
  JobType,
  MasteryLevel
} from '../types';

export const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbx1Yhzx5-BP-wB5pusRu57TB7lgRK1pgqExLwHtn3j9BYUvVxzbzLWysrHhG9ezXjRAXA/exec';

const SUBMISSION_CACHE_KEY = 'gas_recent_submissions_v1';
const PENDING_QUEUE_KEY = 'gas_pending_queue_v1';

export class GasService {
  /**
   * Get configured Apps Script URL (fallback to default)
   */
  public static getGasUrl(): string {
    const settings = DataService.getTeacherSettings();
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.trim().startsWith('http')) {
      return settings.gasWebAppUrl.trim();
    }
    return DEFAULT_GAS_URL;
  }

  /**
   * Set custom Apps Script URL
   */
  public static setGasUrl(url: string): void {
    const settings = DataService.getTeacherSettings();
    settings.gasWebAppUrl = url.trim();
    settings.updatedAt = new Date().toISOString();
    DataService.saveTeacherSettings(settings);
  }

  /**
   * Reset Apps Script URL to default
   */
  public static resetGasUrlToDefault(): void {
    this.setGasUrl(DEFAULT_GAS_URL);
  }

  /**
   * Generate a unique submission ID
   */
  public static generateSubmissionId(studentId: string, stageId: number): string {
    return `sub_${studentId}_s${stageId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  }

  /**
   * Check if a submission was recently sent (prevent double-clicks within 3 seconds)
   */
  private static isDuplicateSubmission(key: string): boolean {
    try {
      const raw = localStorage.getItem(SUBMISSION_CACHE_KEY);
      const cache: Record<string, number> = raw ? JSON.parse(raw) : {};
      const now = Date.now();
      
      // Clean old entries older than 1 minute
      const cleaned: Record<string, number> = {};
      Object.keys(cache).forEach((k) => {
        if (now - cache[k] < 60000) {
          cleaned[k] = cache[k];
        }
      });

      if (cleaned[key] && now - cleaned[key] < 3000) {
        return true;
      }

      cleaned[key] = now;
      localStorage.setItem(SUBMISSION_CACHE_KEY, JSON.stringify(cleaned));
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Save a single stage completion/attempt to Google Sheets via GAS doPost
   */
  public static async saveStageResult(
    submission: GasStageSubmission,
    urlOverride?: string
  ): Promise<GasApiResponse> {
    const url = urlOverride || this.getGasUrl();
    const dedupKey = `${submission.id}_${submission.stageId}_${submission.score}_${submission.correctCount}`;

    if (this.isDuplicateSubmission(dedupKey)) {
      return {
        success: true,
        message: '동일한 결과가 이미 전송되었습니다. (중복 방지)',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Sending text/plain avoids CORS preflight OPTIONS request failures on GAS
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(submission),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GasApiResponse = await response.json();
      
      // Update last synced time
      const settings = DataService.getTeacherSettings();
      settings.lastSyncedAt = new Date().toISOString();
      DataService.saveTeacherSettings(settings);

      return data;
    } catch (err: any) {
      console.warn('[GasService] saveStageResult failed (offline/error):', err);
      
      // Save to pending offline queue for later retry
      this.enqueuePendingSubmission(submission);

      return {
        success: false,
        error: err.name === 'AbortError' 
          ? '스프레드시트 응답 시간 초과 (15초). 로컬에 안전하게 저장되었습니다.' 
          : (err.message || '네트워크 오류가 발생했습니다. 로컬에 저장되었습니다.'),
      };
    }
  }

  /**
   * Fetch all or filtered records from Google Sheets via GAS doGet
   */
  public static async fetchRecords(
    filters?: {
      studentId?: string;
      number?: number;
      stageId?: number;
    },
    urlOverride?: string
  ): Promise<GasApiResponse> {
    const baseUrl = urlOverride || this.getGasUrl();
    const urlObj = new URL(baseUrl);

    // Cache-busting timestamp
    urlObj.searchParams.set('_t', Date.now().toString());

    if (filters?.studentId) {
      urlObj.searchParams.set('studentId', filters.studentId);
    }
    if (filters?.number !== undefined) {
      urlObj.searchParams.set('number', filters.number.toString());
    }
    if (filters?.stageId !== undefined) {
      urlObj.searchParams.set('stageId', filters.stageId.toString());
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(urlObj.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GasApiResponse = await response.json();
      return data;
    } catch (err: any) {
      console.error('[GasService] fetchRecords error:', err);
      return {
        success: false,
        total: 0,
        records: [],
        error: err.name === 'AbortError' 
          ? '조회 요청 시간이 초과되었습니다.' 
          : (err.message || '데이터를 불러오는 중 오류가 발생했습니다.'),
      };
    }
  }

  /**
   * Run a thorough connectivity test for GET and POST against the Google Apps Script Web App
   */
  public static async testConnection(targetUrl?: string): Promise<GasConnectionTestResult> {
    const url = (targetUrl || this.getGasUrl()).trim();
    const startTime = performance.now();

    if (!url.startsWith('https://script.google.com/macros/s/')) {
      return {
        success: false,
        status: 'failed',
        url,
        latencyMs: 0,
        canGet: false,
        canPost: false,
        recordCount: 0,
        message: '올바른 Google Apps Script 웹 앱 URL 형식이 아닙니다.',
        errorDetails: 'URL은 https://script.google.com/macros/s/.../exec 형태여야 합니다.',
        testedAt: new Date().toISOString(),
      };
    }

    let canGet = false;
    let canPost = false;
    let recordCount = 0;
    let errorDetails = '';

    // 1. Test GET
    try {
      const getRes = await this.fetchRecords(undefined, url);
      if (getRes.success) {
        canGet = true;
        recordCount = getRes.total || (getRes.records ? getRes.records.length : 0);
      } else {
        errorDetails += `[GET 실패] ${getRes.error || '응답 오류'}; `;
      }
    } catch (e: any) {
      errorDetails += `[GET 통신 에러] ${e.message}; `;
    }

    // 2. Test POST ping
    try {
      const pingPayload: GasStageSubmission = {
        submissionId: `ping_${Date.now()}`,
        submittedAt: new Date().toISOString(),
        grade: 3,
        classNo: 3,
        number: 99,
        name: '연결테스트',
        id: '3-3-99',
        job: 'warrior',
        level: 1,
        stageId: 1,
        stageTitle: '연결 진단',
        mastery: '기본',
        score: 100,
        correctCount: 1,
        wrongCount: 0,
        accuracyRate: 100,
        tryCount: 1,
        hintCount: 0,
        errorType: '없음',
        gold: 0,
        exp: 0,
        praiseStickers: 0,
        remarks: 'Apps Script 연결 테스트 핑',
        mode: 'update',
      };

      const postRes = await this.saveStageResult(pingPayload, url);
      if (postRes.success) {
        canPost = true;
      } else {
        errorDetails += `[POST 실패] ${postRes.error || '저장 응답 오류'}; `;
      }
    } catch (e: any) {
      errorDetails += `[POST 통신 에러] ${e.message}; `;
    }

    const latencyMs = Math.round(performance.now() - startTime);
    const success = canGet; // As long as GET succeeds, connectivity is confirmed

    return {
      success,
      status: success ? 'success' : 'failed',
      url,
      latencyMs,
      canGet,
      canPost,
      recordCount,
      message: success
        ? `Google Apps Script 및 스프레드시트와 정상 연결되었습니다. (${latencyMs}ms, 현재 저장된 기록: ${recordCount}건)`
        : 'Google Apps Script 연결에 실패했습니다. 배포 권한과 URL을 확인하세요.',
      errorDetails: errorDetails || undefined,
      testedAt: new Date().toISOString(),
    };
  }

  /**
   * Synchronize Google Sheets records into local StudentData storage
   * Parses rows from sheet and merges with local accounts
   */
  public static syncRecordsToLocalStudents(records: GasRecord[]): {
    updatedStudentsCount: number;
    totalRecordsProcessed: number;
  } {
    if (!records || records.length === 0) {
      return { updatedStudentsCount: 0, totalRecordsProcessed: 0 };
    }

    const currentStudents = DataService.getAllStudents();
    const studentMap = new Map<string, StudentData>();

    currentStudents.forEach((s) => {
      studentMap.set(s.account.id, s);
    });

    let updatedCount = 0;

    records.forEach((rec) => {
      const studentId = String(rec['학생아이디'] || (rec['번호'] ? `3-3-${String(rec['번호']).padStart(2, '0')}` : '')).trim();
      if (!studentId) return;

      let student = studentMap.get(studentId);

      // If student does not exist locally yet, create basic profile
      if (!student) {
        const studentName = String(rec['이름'] || `${rec['번호'] || 1}번 학생`);
        const studentNum = Number(rec['번호']) || 1;
        const jobStr = String(rec['직업'] || 'warrior').toLowerCase();
        const validJob: JobType = (['warrior', 'wizard', 'healer', 'explorer'].includes(jobStr) 
          ? jobStr 
          : 'warrior') as JobType;

        student = createDefaultStudentProfile(
          {
            id: studentId,
            password: '1234',
            grade: Number(rec['학년']) || 3,
            classNo: Number(rec['반']) || 3,
            number: studentNum,
            name: studentName,
            createdAt: String(rec['제출일시'] || new Date().toISOString()),
            updatedAt: String(rec['제출일시'] || new Date().toISOString()),
          },
          validJob,
          studentName
        );
        studentMap.set(studentId, student);
      }

      // Update character attributes if higher in sheet
      const sheetLevel = Number(rec['레벨']) || 1;
      const sheetGold = Number(rec['획득골드']) || 0;
      const sheetExp = Number(rec['획득경험치']) || 0;
      const sheetPraise = Number(rec['칭찬스티커']) || 0;

      if (sheetLevel > student.character.level) student.character.level = sheetLevel;
      if (sheetGold > student.character.gold) student.character.gold = sheetGold;
      if (sheetExp > student.character.exp) student.character.exp = sheetExp;
      if (sheetPraise > (student.character.praiseStickers || 0)) {
        student.character.praiseStickers = sheetPraise;
      }

      // Update Stage Record
      const stageId = Number(rec['차시']);
      if (stageId >= 1 && stageId <= 12) {
        const existingStage = student.stages[stageId] || {
          stageId,
          completed: false,
          mastery: '보충',
          score: 0,
          correctCount: 0,
          wrongCount: 0,
          tryCount: 0,
          hintCount: 0,
          basicSolved: 0,
          advancedSolved: 0,
          challengeSolved: 0,
          applicationSolved: 0,
          createdProblems: 0,
          wrongQuestions: [],
          updatedAt: new Date().toISOString(),
        };

        const correctCount = Number(rec['정답수']) || 0;
        const wrongCount = Number(rec['오답수']) || 0;
        const mastery = (rec['성취수준'] || '기본') as MasteryLevel;

        let wrongQuestions: WrongQuestionRecord[] = [];
        if (rec['오답상세']) {
          if (Array.isArray(rec['오답상세'])) {
            wrongQuestions = rec['오답상세'];
          } else if (typeof rec['오답상세'] === 'string' && rec['오답상세'].startsWith('[')) {
            try {
              wrongQuestions = JSON.parse(rec['오답상세']);
            } catch {}
          }
        }

        student.stages[stageId] = {
          ...existingStage,
          completed: true,
          mastery: ['보충', '기본', '심화', '완전정복'].includes(mastery) ? mastery : '기본',
          score: Number(rec['점수']) || (correctCount * 10),
          correctCount: Math.max(existingStage.correctCount, correctCount),
          wrongCount: Math.max(existingStage.wrongCount, wrongCount),
          tryCount: Math.max(existingStage.tryCount, Number(rec['도전횟수']) || 1),
          hintCount: Math.max(existingStage.hintCount, Number(rec['힌트사용수']) || 0),
          wrongQuestions: wrongQuestions.length > 0 ? wrongQuestions : existingStage.wrongQuestions,
          updatedAt: String(rec['제출일시'] || new Date().toISOString()),
        };

        updatedCount++;
      }

      student.lastLearningAt = String(rec['제출일시'] || student.lastLearningAt || new Date().toISOString());
      student.updatedAt = new Date().toISOString();
    });

    // Recalculate totals and save all
    const mergedStudents = Array.from(studentMap.values()).map((st) => {
      let totC = 0;
      let totW = 0;
      let totH = 0;
      let totR = 0;
      for (let s = 1; s <= 12; s++) {
        if (st.stages[s]) {
          totC += st.stages[s].correctCount;
          totW += st.stages[s].wrongCount;
          totH += st.stages[s].hintCount;
          totR += st.stages[s].tryCount;
        }
      }
      st.totalCorrect = totC;
      st.totalWrong = totW;
      st.totalHints = totH;
      st.totalRetries = totR;
      return st;
    });

    DataService.saveAllStudents(mergedStudents);

    return {
      updatedStudentsCount: mergedStudents.length,
      totalRecordsProcessed: records.length,
    };
  }

  /**
   * Push all current students' stage data to Google Sheets
   */
  public static async pushAllStudentsToGas(onProgress?: (current: number, total: number) => void): Promise<{
    successCount: number;
    failedCount: number;
  }> {
    const students = DataService.getAllStudents();
    const submissions: GasStageSubmission[] = [];

    students.forEach((student) => {
      for (let s = 1; s <= 12; s++) {
        const stageRec = student.stages[s];
        if (stageRec && (stageRec.completed || stageRec.correctCount > 0 || stageRec.wrongCount > 0)) {
          const tot = stageRec.correctCount + stageRec.wrongCount;
          const acc = tot > 0 ? Math.round((stageRec.correctCount / tot) * 100) : 0;
          
          submissions.push({
            submissionId: this.generateSubmissionId(student.account.id, s),
            submittedAt: stageRec.updatedAt || new Date().toISOString(),
            grade: student.account.grade || 3,
            classNo: student.account.classNo || 3,
            number: student.account.number || 1,
            name: student.account.name || '학생',
            id: student.account.id,
            job: student.character.job,
            level: student.character.level,
            stageId: s,
            stageTitle: `${s}차시`,
            mastery: stageRec.mastery,
            score: stageRec.score || 0,
            correctCount: stageRec.correctCount,
            wrongCount: stageRec.wrongCount,
            accuracyRate: acc,
            tryCount: stageRec.tryCount || 1,
            hintCount: stageRec.hintCount || 0,
            errorType: stageRec.wrongQuestions?.[0]?.errorType || '없음',
            wrongQuestions: stageRec.wrongQuestions,
            gold: student.character.gold,
            exp: student.character.exp,
            praiseStickers: student.character.praiseStickers || 0,
            remarks: '전체 동기화 업로드',
            mode: 'update',
          });
        }
      }
    });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < submissions.length; i++) {
      if (onProgress) {
        onProgress(i + 1, submissions.length);
      }
      try {
        const res = await this.saveStageResult(submissions[i]);
        if (res.success) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
      // Small pause to prevent rate limiting
      await new Promise((r) => setTimeout(r, 120));
    }

    return { successCount, failedCount };
  }

  // --- Offline Queue Helpers ---
  private static enqueuePendingSubmission(submission: GasStageSubmission): void {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      const queue: GasStageSubmission[] = raw ? JSON.parse(raw) : [];
      queue.push(submission);
      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue.slice(-50))); // Keep last 50
    } catch {}
  }

  public static async flushPendingSubmissions(): Promise<number> {
    try {
      const raw = localStorage.getItem(PENDING_QUEUE_KEY);
      if (!raw) return 0;
      const queue: GasStageSubmission[] = JSON.parse(raw);
      if (queue.length === 0) return 0;

      let flushed = 0;
      const remaining: GasStageSubmission[] = [];

      for (const item of queue) {
        const res = await this.saveStageResult(item);
        if (res.success) {
          flushed++;
        } else {
          remaining.push(item);
        }
      }

      localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(remaining));
      return flushed;
    } catch {
      return 0;
    }
  }
}
