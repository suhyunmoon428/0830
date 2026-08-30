import { StudentData, StudentAiAssessment, TeacherSettings } from '../types';
import { DataService } from './dataService';
import { STAGES_METADATA } from '../data/gameData';

export type AssessmentProfileCategory =
  | 'HIGH_ACCURACY_ADVANCED'
  | 'DIVERSE_STRATEGIES'
  | 'GROWTH_IMPROVEMENT'
  | 'SELF_CORRECTION_RESILIENCE'
  | 'CREATIVE_PROBLEM_SOLVER'
  | 'DILIGENT_BASIC_MASTERY';

export interface StudentLearningTelemetry {
  studentId: string;
  studentName: string;
  grade: number;
  classNo: number;
  number: number;
  job: string;
  level: number;
  exp: number;
  gold: number;
  praiseStickers: number;
  totalCorrect: number;
  totalWrong: number;
  accuracyRate: number;
  totalRetries: number;
  totalHints: number;
  completedStagesCount: number;
  masteryBreakdown: {
    perfect: number;
    advanced: number;
    basic: number;
    supplementary: number;
  };
  stagesSummary: Array<{
    stageId: number;
    title: string;
    completed: boolean;
    mastery: string;
    correct: number;
    wrong: number;
    accuracy: number;
    retries: number;
  }>;
  primaryErrorTypes: string[];
  selfCorrectionCount: number;
  bossStageCompleted: boolean;
  problemCreationCount: number;
  profileCategory: AssessmentProfileCategory;
  categoryReason: string;
}

export class AiAssessmentService {
  // 1. Analyze and Compile Student Telemetry
  public static compileStudentTelemetry(student: StudentData): StudentLearningTelemetry {
    const account = student.account;
    const stages = student.stages || {};

    let totalCorrect = 0;
    let totalWrong = 0;
    let totalRetries = 0;
    let totalHints = 0;
    let completedStagesCount = 0;
    let selfCorrectionCount = 0;
    let problemCreationCount = 0;

    const masteryBreakdown = {
      perfect: 0,
      advanced: 0,
      basic: 0,
      supplementary: 0,
    };

    const errorTypeMap: Record<string, number> = {};
    const stagesSummary: StudentLearningTelemetry['stagesSummary'] = [];

    // Early vs Late stages accuracy comparison for growth calculation
    let earlyStagesCorrect = 0;
    let earlyStagesTotal = 0;
    let lateStagesCorrect = 0;
    let lateStagesTotal = 0;

    for (let st = 1; st <= 12; st++) {
      const stageRec = stages[st];
      const stageMeta = STAGES_METADATA.find((m) => m.id === st);
      const stageTitle = stageMeta ? stageMeta.title.split(': ')[1] || stageMeta.title : `${st}차시`;

      if (stageRec) {
        const correct = stageRec.correctCount || 0;
        const wrong = stageRec.wrongCount || 0;
        const sum = correct + wrong;
        const acc = sum > 0 ? Math.round((correct / sum) * 100) : 0;
        const retries = (stageRec.tryCount || 1) - 1;

        totalCorrect += correct;
        totalWrong += wrong;
        totalRetries += Math.max(0, retries);
        totalHints += stageRec.hintCount || 0;
        problemCreationCount += stageRec.createdProblems || 0;

        if (stageRec.completed) {
          completedStagesCount++;
          if (wrong > 0 && stageRec.completed) {
            selfCorrectionCount++;
          }
        }

        if (stageRec.mastery === '완전정복') masteryBreakdown.perfect++;
        else if (stageRec.mastery === '심화') masteryBreakdown.advanced++;
        else if (stageRec.mastery === '기본') masteryBreakdown.basic++;
        else if (stageRec.mastery === '보충') masteryBreakdown.supplementary++;

        // Track errors
        if (stageRec.wrongQuestions && stageRec.wrongQuestions.length > 0) {
          stageRec.wrongQuestions.forEach((wq) => {
            if (wq.errorType) {
              errorTypeMap[wq.errorType] = (errorTypeMap[wq.errorType] || 0) + 1;
            }
          });
        }

        // Early vs Late stages
        if (st <= 6) {
          earlyStagesCorrect += correct;
          earlyStagesTotal += sum;
        } else {
          lateStagesCorrect += correct;
          lateStagesTotal += sum;
        }

        stagesSummary.push({
          stageId: st,
          title: stageTitle,
          completed: stageRec.completed,
          mastery: stageRec.mastery || '미학습',
          correct,
          wrong,
          accuracy: acc,
          retries: Math.max(0, retries),
        });
      } else {
        stagesSummary.push({
          stageId: st,
          title: stageTitle,
          completed: false,
          mastery: '미학습',
          correct: 0,
          wrong: 0,
          accuracy: 0,
          retries: 0,
        });
      }
    }

    // Fallback totals from student profile if stage record is empty
    if (totalCorrect === 0 && totalWrong === 0) {
      totalCorrect = student.totalCorrect || 0;
      totalWrong = student.totalWrong || 0;
      totalHints = student.totalHints || 0;
      totalRetries = student.totalRetries || 0;
    }

    const grandTotal = totalCorrect + totalWrong;
    const overallAccuracy = grandTotal > 0 ? Math.round((totalCorrect / grandTotal) * 100) : 75;

    // Sort primary error types
    const primaryErrorTypes = Object.entries(errorTypeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([err]) => err);

    // Boss stage completed check (Stage 12 or 8)
    const bossStageCompleted = stages[12]?.completed || stages[8]?.completed || false;

    // Growth check
    const earlyAcc = earlyStagesTotal > 0 ? earlyStagesCorrect / earlyStagesTotal : 0.6;
    const lateAcc = lateStagesTotal > 0 ? lateStagesCorrect / lateStagesTotal : 0.8;
    const hasStrongGrowth = lateAcc - earlyAcc >= 0.2 && lateStagesTotal >= 4;

    // Determine Profile Archetype (1 of 6 criteria)
    let profileCategory: AssessmentProfileCategory = 'DILIGENT_BASIC_MASTERY';
    let categoryReason = '성실한 기본 연산 및 과제 완수';

    if (overallAccuracy >= 88 && (masteryBreakdown.perfect + masteryBreakdown.advanced >= 4 || bossStageCompleted)) {
      profileCategory = 'HIGH_ACCURACY_ADVANCED';
      categoryReason = '개념 이해와 심화 곱셈 문제 해결 및 추론 능력 우수';
    } else if (problemCreationCount >= 2 || (student.character.mathMonsters && student.character.mathMonsters.length >= 4)) {
      profileCategory = 'CREATIVE_PROBLEM_SOLVER';
      categoryReason = '문제 만들기 및 수학 퍼즐에서 높은 사고력과 창의성 발휘';
    } else if (selfCorrectionCount >= 3 || (totalRetries >= 3 && overallAccuracy >= 70)) {
      profileCategory = 'SELF_CORRECTION_RESILIENCE';
      categoryReason = '오답 발생 시 꼼꼼한 점검과 재도전을 통한 자기 수정 능력 탁월';
    } else if (hasStrongGrowth) {
      profileCategory = 'GROWTH_IMPROVEMENT';
      categoryReason = '초기 단계 대비 뚜렷한 계산 정확도 향상 및 성실한 학습 태도';
    } else if (student.character.inventory.length >= 3 || (student.character.skills && student.character.skills.length >= 2)) {
      profileCategory = 'DIVERSE_STRATEGIES';
      categoryReason = '다양한 연산 도구와 전략을 탐색하며 유연하게 접근';
    } else {
      profileCategory = 'DILIGENT_BASIC_MASTERY';
      categoryReason = '기본 계산 원리를 이해하고 차시별 학습에 꾸준히 참여';
    }

    return {
      studentId: account.id,
      studentName: account.name,
      grade: account.grade,
      classNo: account.classNo,
      number: account.number,
      job: student.character.job,
      level: student.character.level,
      exp: student.character.exp,
      gold: student.character.gold,
      praiseStickers: student.character.praiseStickers || 0,
      totalCorrect,
      totalWrong,
      accuracyRate: overallAccuracy,
      totalRetries,
      totalHints,
      completedStagesCount,
      masteryBreakdown,
      stagesSummary,
      primaryErrorTypes,
      selfCorrectionCount,
      bossStageCompleted,
      problemCreationCount,
      profileCategory,
      categoryReason,
    };
  }

  // 2. Generate Single Student Assessment
  public static async generateSingleAssessment(
    student: StudentData,
    options?: {
      variationIndex?: number;
      customApiKey?: string;
      customModel?: string;
      excludeTexts?: string[];
    }
  ): Promise<{
    success: boolean;
    assessment?: StudentAiAssessment;
    provider?: string;
    error?: string;
  }> {
    try {
      const telemetry = this.compileStudentTelemetry(student);
      const settings = DataService.getTeacherSettings();
      const apiKey = options?.customApiKey || settings.openrouterApiKey || '';
      const model = options?.customModel || settings.openrouterModel || 'google/gemini-2.0-flash-001';

      const response = await fetch('/api/assessment/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student: telemetry,
          apiKey,
          model,
          variationIndex: options?.variationIndex ?? 0,
          excludeTexts: options?.excludeTexts || (student.aiAssessment?.history?.map((h) => h.text) || []),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `서버 응답 오류 (${response.status})`);
      }

      const resData = await response.json();
      if (!resData.success || !resData.assessments || resData.assessments.length === 0) {
        throw new Error(resData.error || '평어가 올바르게 생성되지 않았습니다.');
      }

      const rawAssessment = resData.assessments[0];
      const newHistory = student.aiAssessment?.history ? [...student.aiAssessment.history] : [];
      if (student.aiAssessment?.text) {
        newHistory.push({
          text: student.aiAssessment.text,
          generatedAt: student.aiAssessment.generatedAt,
        });
      }

      const finalized: StudentAiAssessment = {
        text: rawAssessment.text,
        summaryTraits: rawAssessment.summaryTraits || telemetry.categoryReason,
        profileCategory: rawAssessment.profileCategory || telemetry.profileCategory,
        generatedAt: new Date().toISOString(),
        isCustomEdited: false,
        modelUsed: resData.provider,
        history: newHistory.slice(-5),
      };

      return {
        success: true,
        assessment: finalized,
        provider: resData.provider,
      };
    } catch (err: any) {
      console.error('[AiAssessmentService] Single generation failed:', err);
      return {
        success: false,
        error: err.message || 'AI 평어 생성 중 문제가 발생했습니다.',
      };
    }
  }

  // 3. Batch Generate Assessments for Entire Class
  public static async generateClassBatchAssessments(
    students: StudentData[],
    options?: {
      customApiKey?: string;
      customModel?: string;
      onProgress?: (current: number, total: number) => void;
    }
  ): Promise<{
    success: boolean;
    results: Record<string, StudentAiAssessment>;
    successCount: number;
    failedCount: number;
    provider?: string;
  }> {
    const results: Record<string, StudentAiAssessment> = {};
    let successCount = 0;
    let failedCount = 0;
    let usedProvider = 'openrouter';

    const settings = DataService.getTeacherSettings();
    const apiKey = options?.customApiKey || settings.openrouterApiKey || '';
    const model = options?.customModel || settings.openrouterModel || 'google/gemini-2.0-flash-001';

    const telemetries = students.map((s) => this.compileStudentTelemetry(s));
    const total = telemetries.length;

    // Process in batches of 5 students to avoid prompt limit and ensure variety
    const BATCH_SIZE = 5;
    const allGeneratedTexts: string[] = [];

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const chunk = telemetries.slice(i, i + BATCH_SIZE);

      try {
        const response = await fetch('/api/assessment/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            students: chunk,
            apiKey,
            model,
            variationIndex: i,
            excludeTexts: allGeneratedTexts.slice(-20),
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.assessments) {
            usedProvider = resData.provider || usedProvider;
            resData.assessments.forEach((item: any) => {
              const matchedStudent = students.find((s) => s.account.id === item.studentId);
              const tel = chunk.find((c) => c.studentId === item.studentId);

              const assessmentObj: StudentAiAssessment = {
                text: item.text,
                summaryTraits: item.summaryTraits || tel?.categoryReason || '곱셈 연산 원리 이해',
                profileCategory: item.profileCategory || tel?.profileCategory || 'DILIGENT_BASIC_MASTERY',
                generatedAt: new Date().toISOString(),
                isCustomEdited: false,
                modelUsed: resData.provider,
              };

              results[item.studentId] = assessmentObj;
              allGeneratedTexts.push(item.text);
              successCount++;
            });
          } else {
            failedCount += chunk.length;
          }
        } else {
          failedCount += chunk.length;
        }
      } catch (chunkErr) {
        console.warn('[AiAssessmentService] Chunk batch generation error:', chunkErr);
        failedCount += chunk.length;
      }

      if (options?.onProgress) {
        options.onProgress(Math.min(i + chunk.length, total), total);
      }
    }

    return {
      success: successCount > 0,
      results,
      successCount,
      failedCount,
      provider: usedProvider,
    };
  }

  // 4. Save assessment to a student in DataService
  public static saveStudentAssessment(studentId: string, assessment: StudentAiAssessment): boolean {
    const student = DataService.getStudentData(studentId);
    if (!student) return false;

    student.aiAssessment = assessment;
    student.updatedAt = new Date().toISOString();
    DataService.saveStudentData(student);
    return true;
  }

  // 5. Batch Save Assessments
  public static saveBatchAssessments(assessmentsMap: Record<string, StudentAiAssessment>): number {
    let savedCount = 0;
    Object.entries(assessmentsMap).forEach(([studentId, assessment]) => {
      const student = DataService.getStudentData(studentId);
      if (student) {
        student.aiAssessment = assessment;
        student.updatedAt = new Date().toISOString();
        DataService.saveStudentData(student);
        savedCount++;
      }
    });
    return savedCount;
  }

  // 6. Test OpenRouter Connection
  public static async testOpenRouterConnection(
    apiKey?: string,
    model?: string
  ): Promise<{ success: boolean; message: string; sampleOutput?: string; error?: string }> {
    try {
      const response = await fetch('/api/assessment/test-openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model }),
      });

      const data = await response.json();
      return data;
    } catch (e: any) {
      return {
        success: false,
        message: '테스트 요청 실패',
        error: e.message || '네트워크 오류',
      };
    }
  }

  // 7. Copy single assessment or all assessments to clipboard
  public static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  }

  // 8. Export All Assessments as CSV / Excel-friendly format
  public static exportAssessmentsCSV(students: StudentData[]): void {
    const headers = ['학번', '번호', '이름', '성취수준', '주요특성', 'AI 수학 평어(생활기록부)', '작성일시', '수정여부'];
    const rows = students.map((s) => {
      const ass = s.aiAssessment;
      return [
        s.account.id,
        s.account.number,
        s.account.name,
        s.stages[12]?.mastery || '기본',
        ass?.summaryTraits || '-',
        ass?.text ? `"${ass.text.replace(/"/g, '""')}"` : '"미생성"',
        ass?.generatedAt ? new Date(ass.generatedAt).toLocaleDateString() : '-',
        ass?.isCustomEdited ? '교사수정' : 'AI원문',
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `수학_AI_평어_기록_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
