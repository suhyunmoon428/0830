import { DataService } from './dataService';
import { STAGES_METADATA } from '../data/gameData';
import { StudentData, ErrorType, MasteryLevel } from '../types';

export interface ClassOverview {
  totalStudents: number;
  activeStudents: number;
  avgProgress: number; // 0 to 100 %
  avgAccuracy: number; // 0 to 100 %
  avgExp: number;
  avgGold: number;
  avgLevel: number;
  masteryDistribution: {
    advanced: number;
    basic: number;
    supplementary: number;
  };
  jobDistribution: {
    warrior: number;
    wizard: number;
    healer: number;
    explorer: number;
  };
  monsterCollectionRate: number; // 0 to 100 %
}

export interface StageAnalysisItem {
  stageId: number;
  title: string;
  subtitle: string;
  completedCount: number;
  attemptedCount: number;
  completionRate: number;
  accuracyRate: number;
  errorRate: number;
  avgRetries: number;
  avgHints: number;
  supplementaryCount: number;
  basicCount: number;
  advancedCount: number;
  masteryCount: number;
}

export interface VulnerableStageInsight {
  stageId: number;
  title: string;
  errorRate: number;
  affectedStudentsCount: number;
  primaryErrorType: string;
  diagnosticSummary: string;
  pedagogicalAdvice: string;
}

export interface SosStudentInsight {
  student: StudentData;
  riskScore: number;
  reasons: string[];
  vulnerableStages: number[];
  primaryErrorTypes: string[];
  recommendedAction: string;
}

export class AnalysisService {
  // 1. Get All Student Records
  public static getStudents(): StudentData[] {
    return DataService.getAllStudents();
  }

  // 2. Class Overview Calculation
  public static getClassOverview(): ClassOverview {
    const students = this.getStudents();
    const total = students.length;

    if (total === 0) {
      return {
        totalStudents: 0,
        activeStudents: 0,
        avgProgress: 0,
        avgAccuracy: 0,
        avgExp: 0,
        avgGold: 0,
        avgLevel: 1,
        masteryDistribution: { advanced: 0, basic: 0, supplementary: 0 },
        jobDistribution: { warrior: 0, wizard: 0, healer: 0, explorer: 0 },
        monsterCollectionRate: 0,
      };
    }

    let activeCount = 0;
    let totalCompletedStages = 0;
    let grandCorrect = 0;
    let grandWrong = 0;
    let sumExp = 0;
    let sumGold = 0;
    let sumLevel = 0;
    let sumMonsters = 0;

    const masteryDist = { advanced: 0, basic: 0, supplementary: 0 };
    const jobDist = { warrior: 0, wizard: 0, healer: 0, explorer: 0 };

    students.forEach((s) => {
      const isStudentActive = s.totalCorrect > 0 || s.totalWrong > 0 || s.character.level > 1;
      if (isStudentActive) activeCount++;

      let completedStages = 0;
      let studentCorrect = 0;
      let studentWrong = 0;

      for (let st = 1; st <= 12; st++) {
        const stageRec = s.stages[st];
        if (stageRec) {
          if (stageRec.completed) completedStages++;
          studentCorrect += stageRec.correctCount;
          studentWrong += stageRec.wrongCount;
        }
      }

      totalCompletedStages += completedStages;
      grandCorrect += studentCorrect > 0 ? studentCorrect : s.totalCorrect;
      grandWrong += studentWrong > 0 ? studentWrong : s.totalWrong;

      sumExp += s.character.exp;
      sumGold += s.character.gold;
      sumLevel += s.character.level;
      sumMonsters += s.character.mathMonsters.length;

      // Student overall mastery
      const studentTotalAnswers = studentCorrect + studentWrong;
      const acc = studentTotalAnswers > 0 ? studentCorrect / studentTotalAnswers : 0;
      if (acc >= 0.8 || completedStages >= 8) {
        masteryDist.advanced++;
      } else if (acc >= 0.5 || completedStages >= 3) {
        masteryDist.basic++;
      } else {
        masteryDist.supplementary++;
      }

      // Job distribution
      const job = s.character.job;
      if (job in jobDist) {
        jobDist[job]++;
      }
    });

    const totalQuestions = grandCorrect + grandWrong;
    const avgAccuracy = totalQuestions > 0 ? Math.round((grandCorrect / totalQuestions) * 100) : 0;
    const avgProgress = Math.round((totalCompletedStages / (total * 12)) * 100);
    const avgExp = Math.round(sumExp / total);
    const avgGold = Math.round(sumGold / total);
    const avgLevel = Number((sumLevel / total).toFixed(1));
    const maxMonstersPossible = total * 12;
    const monsterCollectionRate = maxMonstersPossible > 0 ? Math.round((sumMonsters / maxMonstersPossible) * 100) : 0;

    return {
      totalStudents: total,
      activeStudents: activeCount,
      avgProgress,
      avgAccuracy,
      avgExp,
      avgGold,
      avgLevel,
      masteryDistribution: masteryDist,
      jobDistribution: jobDist,
      monsterCollectionRate,
    };
  }

  // 3. Stage-by-Stage Detailed Metrics
  public static getStageAnalysis(): StageAnalysisItem[] {
    const students = this.getStudents();
    const totalStudents = students.length;

    return STAGES_METADATA.map((meta) => {
      let completedCount = 0;
      let attemptedCount = 0;
      let stageCorrectSum = 0;
      let stageWrongSum = 0;
      let stageRetriesSum = 0;
      let stageHintsSum = 0;

      let suppCount = 0;
      let basicCount = 0;
      let advCount = 0;
      let mastCount = 0;

      students.forEach((s) => {
        const record = s.stages[meta.id];
        if (!record) return;

        const totalTries = record.correctCount + record.wrongCount;
        if (totalTries > 0 || record.completed) {
          attemptedCount++;
        }
        if (record.completed) {
          completedCount++;
        }

        stageCorrectSum += record.correctCount;
        stageWrongSum += record.wrongCount;
        stageRetriesSum += record.tryCount;
        stageHintsSum += record.hintCount;

        if (record.mastery === '완전정복') mastCount++;
        else if (record.mastery === '심화') advCount++;
        else if (record.mastery === '기본') basicCount++;
        else suppCount++;
      });

      const totalStageQuestions = stageCorrectSum + stageWrongSum;
      const accuracyRate = totalStageQuestions > 0 ? Math.round((stageCorrectSum / totalStageQuestions) * 100) : 0;
      const errorRate = 100 - accuracyRate;
      const completionRate = totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0;
      const avgRetries = attemptedCount > 0 ? Number((stageRetriesSum / attemptedCount).toFixed(1)) : 0;
      const avgHints = attemptedCount > 0 ? Number((stageHintsSum / attemptedCount).toFixed(1)) : 0;

      return {
        stageId: meta.id,
        title: meta.title,
        subtitle: meta.subtitle,
        completedCount,
        attemptedCount,
        completionRate,
        accuracyRate,
        errorRate: totalStageQuestions > 0 ? errorRate : 0,
        avgRetries,
        avgHints,
        supplementaryCount: suppCount,
        basicCount,
        advancedCount: advCount,
        masteryCount: mastCount,
      };
    });
  }

  // 4. Top 3 Vulnerable Stages with rule-based diagnostic notes
  public static getTop3VulnerableStages(): VulnerableStageInsight[] {
    const stageAnalysis = this.getStageAnalysis();
    const students = this.getStudents();

    // Filter stages that have at least some attempts, sort by error rate descending
    const sorted = [...stageAnalysis]
      .filter((s) => s.attemptedCount > 0 || s.errorRate > 0)
      .sort((a, b) => b.errorRate - a.errorRate);

    const top3 = sorted.slice(0, 3);

    const adviceMap: Record<number, { advice: string; primaryError: string }> = {
      1: { advice: '10배 개념과 묶어 세기를 구체물(수 모형)로 먼저 조작해 보세요.', primaryError: '0의 자릿값 누락' },
      2: { advice: '각 자릿수별 곱을 자릿값에 맞춰 세로로 적는 기본형을 지도하세요.', primaryError: '단순 연산 오류' },
      3: { advice: '일의 자리 곱에서 10이 넘을 때 십의 자리 위에 작게 1을 적어두는 습관을 유도하세요.', primaryError: '일의 자리 올림 누락' },
      4: { advice: '십의 자리 곱의 올림수와 백의 자리 곱의 올림수를 색깔 펜으로 구별해 적도록 지도하세요.', primaryError: '연속 올림수 미합산' },
      5: { advice: '0이 붙는 개수를 세는 직관적 규칙과 10배 원리를 연결해 설명하세요.', primaryError: '0의 개수 혼동' },
      6: { advice: '부분곱(일의 자리 곱과 십의 자리 곱)의 분할 모델 격자를 활용해 보세요.', primaryError: '부분곱 덧셈 누락' },
      7: { advice: '두 자리 수 세로셈에서 십의 자리 곱을 쓸 때 일의 자리를 0으로 비우는 자리 정렬을 점검하세요.', primaryError: '두 자리 곱 자리 정렬 오류' },
      8: { advice: '부분곱 과정 중 발생하는 중간 올림수와 최종 덧셈을 분리하여 단계별로 적게 하세요.', primaryError: '복합 연속 올림 및 정렬 오류' },
      9: { advice: '문장제에서 핵심 수와 질문을 밑줄 긋고, 대략적인 어림값을 먼저 추론하게 지도하세요.', primaryError: '문제 상황 식 세우기 미숙' },
      10: { advice: '수 카드로 가장 큰 곱을 만들 때 가장 큰 숫자를 높은 자릿수에 배치하는 원리를 탐구하게 하세요.', primaryError: '추론 논리 미숙' },
      11: { advice: '정확성을 먼저 다진 후 타이머 챌린지로 연산 유창성을 신장시키세요.', primaryError: '시간 압박으로 인한 실수' },
      12: { advice: '전 차시의 올림 규칙과 부분곱 원리를 종합 정리하는 오답 복습 노트를 지도하세요.', primaryError: '전 영역 복합 혼동' },
    };

    return top3.map((item) => {
      const info = adviceMap[item.stageId] || {
        advice: '단계별 수 모형과 세로셈 격자 지도로 기본 개념을 다져주세요.',
        primaryError: '자릿값 계산 오류',
      };

      // Count students with low score in this stage
      let affectedCount = 0;
      students.forEach((s) => {
        const st = s.stages[item.stageId];
        if (st && st.wrongCount > st.correctCount) {
          affectedCount++;
        }
      });

      return {
        stageId: item.stageId,
        title: item.title,
        errorRate: item.errorRate,
        affectedStudentsCount: Math.max(affectedCount, item.supplementaryCount),
        primaryErrorType: info.primaryError,
        diagnosticSummary: `${item.stageId}차시에서 오답률이 ${item.errorRate}%로 집중 관리가 필요합니다.`,
        pedagogicalAdvice: info.advice,
      };
    });
  }

  // 5. Error Type Breakdown
  public static getErrorTypeBreakdown(): Record<ErrorType, number> {
    const students = this.getStudents();
    const counts: Record<ErrorType, number> = {
      '구구단 오류': 0,
      '일의 자리 계산 오류': 0,
      '올림 누락': 0,
      '자릿값 오류': 0,
      '중간 계산 오류': 0,
      '두 자리 수 곱셈 자리 정렬 오류': 0,
      '덧셈 오류': 0,
      '어림 판단 오류': 0,
      '기타 단순 오답': 0,
    };

    students.forEach((s) => {
      for (let st = 1; st <= 12; st++) {
        const stageRec = s.stages[st];
        if (stageRec && stageRec.wrongQuestions) {
          stageRec.wrongQuestions.forEach((wq) => {
            const err = wq.errorType || '기타 단순 오답';
            if (err in counts) {
              counts[err]++;
            } else {
              counts['기타 단순 오답']++;
            }
          });
        }
      }
    });

    return counts;
  }

  // 6. SOS Student Diagnostics
  public static getSosStudents(): SosStudentInsight[] {
    const students = this.getStudents();
    const overview = this.getClassOverview();
    const classAvgAcc = overview.avgAccuracy;

    const insights: SosStudentInsight[] = [];

    students.forEach((student) => {
      let riskScore = 0;
      const reasons: string[] = [];
      const vulnerableStages: number[] = [];
      const errorMap: Record<string, number> = {};

      let studentCorrect = 0;
      let studentWrong = 0;
      let suppStagesCount = 0;

      for (let st = 1; st <= 12; st++) {
        const stageRec = student.stages[st];
        if (!stageRec) continue;

        studentCorrect += stageRec.correctCount;
        studentWrong += stageRec.wrongCount;

        if (stageRec.wrongCount >= 3 || (stageRec.wrongCount > stageRec.correctCount && stageRec.tryCount >= 4)) {
          riskScore += 2;
          vulnerableStages.push(st);
        }

        if (stageRec.mastery === '보충' && stageRec.tryCount >= 3) {
          suppStagesCount++;
        }

        stageRec.wrongQuestions.forEach((wq) => {
          if (wq.retryCount >= 3) {
            riskScore += 1.5;
          }
          if (wq.errorType) {
            errorMap[wq.errorType] = (errorMap[wq.errorType] || 0) + 1;
          }
        });
      }

      const totalSolved = studentCorrect + studentWrong;
      const studentAcc = totalSolved > 0 ? (studentCorrect / totalSolved) * 100 : 100;

      // Condition 1: Low accuracy compared to class average
      if (totalSolved >= 5 && studentAcc < Math.max(classAvgAcc - 20, 50)) {
        riskScore += 3;
        reasons.push(`정답률(${Math.round(studentAcc)}%)이 학급 평균(${classAvgAcc}%)보다 현저히 낮음`);
      }

      // Condition 2: Frequent hint reliance
      if (student.totalHints >= 12 || (totalSolved > 0 && student.totalHints / totalSolved > 0.4)) {
        riskScore += 2;
        reasons.push(`힌트 의존도 높음 (누적 힌트 ${student.totalHints}회 사용)`);
      }

      // Condition 3: Stuck in supplementary stages
      if (suppStagesCount >= 2) {
        riskScore += 2.5;
        reasons.push(`2개 이상의 차시에서 보충 단계에 머무름`);
      }

      // Condition 4: Repeated errors in same stage
      if (vulnerableStages.length > 0) {
        reasons.push(`취약 차시(${vulnerableStages.join(', ')}차시)에서 3회 이상 오답 반복`);
      }

      if (riskScore >= 3 || reasons.length >= 2) {
        const topErrors = Object.entries(errorMap)
          .sort((a, b) => b[1] - a[1])
          .map(([type]) => type);

        let action = '1:1 개별 보충 지도가 권장됩니다.';
        if (topErrors.includes('올림 누락')) {
          action = '올림수 표기법 및 자릿값 분해 카드 활동을 진행해 주세요.';
        } else if (topErrors.includes('두 자리 수 곱셈 자리 정렬 오류')) {
          action = '부분곱 격자 용지를 활용하여 십의 자리 0 자릿값 정렬을 지도해 주세요.';
        } else if (topErrors.includes('구구단 오류')) {
          action = '기초 곱셈구구 플래시카드 복습을 병행해 주세요.';
        }

        insights.push({
          student,
          riskScore,
          reasons,
          vulnerableStages,
          primaryErrorTypes: topErrors.slice(0, 3),
          recommendedAction: action,
        });
      }
    });

    return insights.sort((a, b) => b.riskScore - a.riskScore);
  }

  // 7. CSV Exporters with UTF-8 BOM
  public static generateAccountsCSV(): string {
    const students = this.getStudents();
    const headers = ['번호', '이름', '학생 아이디', '초기 비밀번호', '직업', '생성일자'];
    const rows = students.map((s) => [
      s.account.number,
      s.account.name,
      s.account.id,
      s.account.password,
      s.character.job,
      s.account.createdAt.slice(0, 10),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\r\n');
    return '\uFEFF' + csvContent;
  }

  public static generateLearningDataCSV(): string {
    const students = this.getStudents();
    const headers = [
      '번호',
      '이름',
      '아이디',
      '직업',
      '레벨',
      'EXP',
      'Gold',
      '총 정답 수',
      '총 오답 수',
      '종합 정답률(%)',
      '1차시 수준',
      '2차시 수준',
      '3차시 수준',
      '4차시 수준',
      '5차시 수준',
      '6차시 수준',
      '7차시 수준',
      '8차시 수준',
      '9차시 수준',
      '10차시 수준',
      '11차시 수준',
      '12차시 수준',
      '수집 수학몬 수',
      '최근 학습일시',
    ];

    const rows = students.map((s) => {
      const totalSolved = s.totalCorrect + s.totalWrong;
      const acc = totalSolved > 0 ? Math.round((s.totalCorrect / totalSolved) * 100) : 0;
      const stageMasteries = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
        (st) => s.stages[st]?.mastery || '미학습'
      );

      return [
        s.account.number,
        s.account.name,
        s.account.id,
        s.character.job,
        s.character.level,
        s.character.exp,
        s.character.gold,
        s.totalCorrect,
        s.totalWrong,
        acc,
        ...stageMasteries,
        s.character.mathMonsters.length,
        s.lastLearningAt ? s.lastLearningAt.slice(0, 10) : '없음',
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\r\n');
    return '\uFEFF' + csvContent;
  }
}
