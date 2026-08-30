import { CURRICULUM_PROBLEMS } from '../data/curriculumData';
import { MathProblem, ErrorType, MasteryLevel } from '../types';

export class LearningService {
  // 1. Get problems for a stage
  public static getStageCurriculum(stageId: number): MathProblem[] {
    return CURRICULUM_PROBLEMS[stageId] || [];
  }

  // 2. Procedural Problem Generator (infinite practice, challenge, and supplementary)
  public static generateProceduralProblem(
    stageId: number,
    number: number,
    difficulty: MathProblem['difficulty'] = '기본'
  ): MathProblem {
    const randomBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    let a = 10;
    let b = 2;
    let title = `${stageId}차시 추가 연습`;
    let type: MathProblem['type'] = 'vertical';
    let question = '';
    let hint1 = '각 자릿값을 확인하고 차례대로 곱해 보세요.';
    let hint2 = '일의 자리 곱부터 계산하고 올림수를 주의하세요.';
    let hint3Text = '수 모형을 생각하며 각 부분의 곱을 합산합니다.';
    let explanation = '';

    switch (stageId) {
      case 1: { // (몇십) × (몇)
        const tens = randomBetween(2, 9);
        const single = randomBetween(2, 9);
        a = tens * 10;
        b = single;
        type = 'standard';
        title = '(몇십)×(몇) 무한 연습';
        question = `${a} × ${b} 의 값을 구하세요.`;
        hint1 = `${tens} × ${b} 에 10배를 하세요.`;
        hint2 = `${tens} × ${b} = ${tens * b} 뒤에 0을 붙입니다.`;
        hint3Text = `십 모형 ${tens}개가 ${b}묶음 모이면 ${tens * b * 10}입니다.`;
        explanation = `${a} × ${b} = ${a * b}`;
        break;
      }
      case 2: { // (세자리) × (한자리) 올림 없음
        const hundreds = randomBetween(1, 3);
        const tens = randomBetween(1, 3);
        const ones = randomBetween(1, 3);
        const mult = randomBetween(2, 3);
        a = hundreds * 100 + tens * 10 + ones;
        b = mult;
        title = '(세 자리 수)×(한 자리 수) 올림 없음';
        question = `${a} × ${b} 의 값을 세로셈으로 계산하세요.`;
        hint1 = '일의 자리, 십의 자리, 백의 자리를 차례로 곱하세요.';
        hint2 = `${ones}×${b}=${ones * b}, ${tens * 10}×${b}=${tens * b * 10}, ${hundreds * 100}×${b}=${hundreds * b * 100}`;
        hint3Text = `각 자리의 곱을 합치면 ${a * b} 입니다.`;
        explanation = `${a} × ${b} = ${a * b}`;
        break;
      }
      case 3: { // (세자리) × (한자리) 일의 자리 올림
        const hundreds = randomBetween(1, 3);
        const tens = randomBetween(1, 3);
        const ones = randomBetween(4, 9);
        const mult = randomBetween(2, 4);
        a = hundreds * 100 + tens * 10 + ones;
        b = mult;
        title = '(세 자리 수)×(한 자리 수) 일의 자리 올림';
        question = `${a} × ${b} 의 값을 구하세요.`;
        hint1 = `일의 자리 곱 ${ones}×${b}=${ones * b} 에서 올림수를 십의 자리에 더해주세요.`;
        hint2 = `십의 자리 ${tens}×${b}에 올림수 ${Math.floor((ones * b) / 10)}를 더합니다.`;
        hint3Text = `일의 자리 올림을 십의 자리에 합산하여 계산합니다.`;
        explanation = `${a} × ${b} = ${a * b}`;
        break;
      }
      case 4: { // 십, 백의 자리 올림
        a = randomBetween(250, 890);
        b = randomBetween(3, 8);
        title = '(세 자리 수)×(한 자리 수) 연속 올림';
        question = `${a} × ${b} 의 값을 계산하세요.`;
        hint1 = '각 자릿수 곱에서 나오는 올림수를 윗자리에 꼼꼼히 더해주세요.';
        hint2 = '일의 자리부터 시작하여 십, 백의 자리 순서로 차근차근 전개합니다.';
        hint3Text = '올림수를 잊지 말고 이전 계산 결과에 합산합니다.';
        explanation = `${a} × ${b} = ${a * b}`;
        break;
      }
      case 5: { // (몇십) × (몇십), (몇십몇) × (몇십)
        if (Math.random() > 0.5) {
          a = randomBetween(2, 9) * 10;
          b = randomBetween(2, 9) * 10;
        } else {
          a = randomBetween(12, 79);
          b = randomBetween(2, 8) * 10;
        }
        title = '(몇십)×(몇십) 자릿수 확장';
        question = `${a} × ${b} 의 값을 구하세요.`;
        hint1 = '0을 제외한 숫자끼리 먼저 곱하고 뒤에 0의 개수만큼 붙이세요.';
        hint2 = `${a} × ${Math.floor(b / 10)} 에 10배를 합니다.`;
        hint3Text = '자릿값 0의 규칙을 활용하세요.';
        explanation = `${a} × ${b} = ${a * b}`;
        break;
      }
      case 6: { // (두자리) × (두자리) 올림 없음
        const t1 = randomBetween(1, 4);
        const o1 = randomBetween(1, 3);
        const t2 = randomBetween(1, 3);
        const o2 = randomBetween(1, 2);
        a = t1 * 10 + o1;
        b = t2 * 10 + o2;
        title = '(두 자리 수)×(두 자리 수) 부분곱';
        question = `${a} × ${b} 의 값을 구하세요.`;
        hint1 = `${a} × ${o2} 와 ${a} × ${t2 * 10} 을 각각 구한 뒤 더합니다.`;
        hint2 = `1단계: ${a} × ${o2} = ${a * o2}, 2단계: ${a} × ${t2 * 10} = ${a * t2 * 10}`;
        hint3Text = `두 부분곱 ${a * o2} + ${a * t2 * 10} = ${a * b} 입니다.`;
        explanation = `${a} × ${b} = ${a * b}`;
        break;
      }
      case 7:
      case 8: { // (두자리) × (두자리) 올림
        a = randomBetween(25, 89);
        b = randomBetween(14, 78);
        title = '(두 자리 수)×(두 자리 수) 정밀 계산';
        question = `${a} × ${b} 의 값을 세로셈으로 구하세요.`;
        const bOnes = b % 10;
        const bTens = Math.floor(b / 10);
        hint1 = `${a} × ${bOnes} 와 ${a} × ${bTens * 10} 의 부분곱을 각각 구하세요.`;
        hint2 = `올림수를 정확히 적고 자릿수를 맞추어 세로셈을 정렬하세요.`;
        hint3Text = `${a * bOnes} + ${a * bTens * 10} = ${a * b}`;
        explanation = `${a} × ${b} = ${a * b}`;
        break;
      }
      case 9: { // 어림 & 문장제
        a = randomBetween(22, 88);
        b = randomBetween(15, 65);
        type = 'word_problem';
        title = '실생활 문장제 무한 연습';
        question = `상자 하나에 과자가 ${a}개씩 들어 있습니다. ${b}상자에 들어 있는 과자는 모두 몇 개일까요?`;
        hint1 = `${a} × ${b} 식을 세워 계산합니다.`;
        hint2 = '대략적인 어림값과 세로셈을 함께 활용하세요.';
        hint3Text = `${a} × ${b} = ${a * b} 개`;
        explanation = `${a} × ${b} = ${a * b}개`;
        break;
      }
      case 10: { // 규칙 퍼즐
        a = randomBetween(20, 85);
        b = randomBetween(3, 9);
        type = 'puzzle';
        title = '곱셈 추론 퍼즐';
        question = `${a} × □ = ${a * b} 일 때, □에 들어갈 숫자는 무엇일까요?`;
        hint1 = `${a}에 어떤 수를 곱해야 ${a * b}가 될지 일의 자리부터 비교해 보세요.`;
        hint2 = `${a * b} ÷ ${a} 또는 곱셈구구를 떠올려 보세요.`;
        hint3Text = `${a} × ${b} = ${a * b} 이므로 정답은 ${b} 입니다.`;
        explanation = `□ = ${b}`;
        return {
          id: `p_gen_s${stageId}_${number}_${Date.now()}`,
          stageId,
          number,
          title,
          question,
          type,
          a,
          b,
          answer: String(b),
          hint1,
          hint2,
          hint3: { text: hint3Text, visualType: 'steps' },
          explanation,
          difficulty,
        };
      }
      case 11: { // 스피드 연산
        a = randomBetween(15, 80);
        b = randomBetween(4, 30);
        type = 'speed';
        title = '스피드 연산 챌린지';
        question = `${a} × ${b} 의 값을 신속하게 계산하세요!`;
        hint1 = '십의 자리와 일의 자리를 빠르게 분해하세요.';
        hint2 = '침착하게 자릿값을 계산합니다.';
        hint3Text = `${a} × ${b} = ${a * b}`;
        explanation = `${a} × ${b} = ${a * b}`;
        break;
      }
      default: { // Stage 12 or general
        a = randomBetween(35, 99);
        b = randomBetween(25, 95);
        type = 'vertical';
        title = '마스터 종합 실전';
        question = `${a} × ${b} 의 값을 구하세요.`;
        hint1 = '두 부분곱의 합으로 계산합니다.';
        hint2 = '올림수를 빠짐없이 기록하세요.';
        hint3Text = `${a} × ${b} = ${a * b}`;
        explanation = `${a} × ${b} = ${a * b}`;
        break;
      }
    }

    return {
      id: `p_gen_s${stageId}_${number}_${Date.now()}`,
      stageId,
      number,
      title,
      question,
      type,
      a,
      b,
      answer: String(a * b),
      hint1,
      hint2,
      hint3: {
        text: hint3Text,
        visualType: stageId <= 4 ? 'base10' : 'grid',
      },
      explanation,
      difficulty,
    };
  }

  // 3. Supplementary Easy Precursor Generator
  public static generateSupplementaryProblem(
    stageId: number,
    baseProblem: MathProblem
  ): MathProblem {
    const a = baseProblem.a || 20;
    const b = baseProblem.b || 3;

    // Create a simplified version focusing on the root concept
    if (stageId <= 4) {
      // Simplify to simpler numbers with base-10 focus
      const simpleA = Math.max(10, Math.floor(a / 10) * 10);
      const simpleB = Math.max(2, Math.min(b, 5));
      return {
        id: `supp_${baseProblem.id}_${Date.now()}`,
        stageId,
        number: baseProblem.number,
        title: '🌱 기초 다지기 보충 문제',
        question: `먼저 쉬운 문제로 연습해 봅시다: ${simpleA} × ${simpleB} 의 값은 얼마일까요?`,
        type: 'standard',
        a: simpleA,
        b: simpleB,
        answer: String(simpleA * simpleB),
        hint1: '십 모형의 개수를 세어 10배를 해주세요.',
        hint2: `${Math.floor(simpleA / 10)} × ${simpleB} = ${(simpleA / 10) * simpleB} 뒤에 0을 붙입니다.`,
        hint3: {
          text: `십 모형 ${simpleA / 10}개가 ${simpleB}묶음 있으면 ${simpleA * simpleB} 입니다.`,
          visualType: 'base10',
        },
        explanation: `${simpleA} × ${simpleB} = ${simpleA * simpleB}`,
        difficulty: '보충',
      };
    } else {
      // 2-digit mult supplementary
      const simpleA = 20;
      const simpleB = Math.max(2, Math.min(b, 15));
      return {
        id: `supp_${baseProblem.id}_${Date.now()}`,
        stageId,
        number: baseProblem.number,
        title: '🌱 기초 다지기 보충 문제',
        question: `부분곱의 원리를 익히기 위해 ${simpleA} × ${simpleB} 를 먼저 풀어보세요.`,
        type: 'standard',
        a: simpleA,
        b: simpleB,
        answer: String(simpleA * simpleB),
        hint1: `2 × ${simpleB} 에 10배를 하세요.`,
        hint2: `2 × ${simpleB} = ${2 * simpleB} 뒤에 0을 붙여 ${simpleA * simpleB}이 됩니다.`,
        hint3: {
          text: `20 × ${simpleB} = ${simpleA * simpleB}`,
          visualType: 'grid',
        },
        explanation: `${simpleA} × ${simpleB} = ${simpleA * simpleB}`,
        difficulty: '보충',
      };
    }
  }

  // 4. Rule-Based Error Diagnosis
  public static diagnoseError(
    problem: MathProblem,
    studentAnswer: string
  ): ErrorType {
    const studentNum = parseInt(studentAnswer.trim(), 10);
    const correctNum = parseInt(problem.answer.trim(), 10);

    if (isNaN(studentNum) || isNaN(correctNum)) {
      return '기타 단순 오답';
    }

    const diff = Math.abs(studentNum - correctNum);
    const a = problem.a;
    const b = problem.b;

    // Check 1: Place value error (10x or 100x or missing zero)
    if (studentNum === correctNum * 10 || studentNum * 10 === correctNum || studentNum === correctNum * 100) {
      return '자릿값 오류';
    }

    // Check 2: Missing carry-over (올림 누락)
    if (problem.type === 'vertical' || problem.stageId >= 2) {
      // Check if student forgot carry in simple 3-digit x 1-digit
      if (a && b && a >= 100 && b < 10) {
        const ones = a % 10;
        const tens = Math.floor((a % 100) / 10);
        const hundreds = Math.floor(a / 100);
        const rawNoCarry = hundreds * b * 100 + tens * b * 10 + (ones * b);
        if (studentNum === rawNoCarry || diff % 10 === 0 && diff <= 100) {
          return '올림 누락';
        }
      }

      // Check 2-digit x 2-digit carry or alignment
      if (a && b && a >= 10 && b >= 10) {
        const bOnes = b % 10;
        const bTens = Math.floor(b / 10);
        // If student added (a * bOnes) + (a * bTens) without 10x shift
        const shiftedMissing = a * bOnes + a * bTens;
        if (studentNum === shiftedMissing) {
          return '두 자리 수 곱셈 자리 정렬 오류';
        }
      }
    }

    // Check 3: Estimation error
    if (problem.stageId === 9 || problem.type === 'multiple_choice') {
      return '어림 판단 오류';
    }

    // Check 4: Single digit / multiplication table miscalculation
    if (diff < 10 && diff !== 0) {
      return '일의 자리 계산 오류';
    }

    // Check 5: Multi-step intermediate addition error
    if (problem.stageId >= 6 && diff > 10 && diff % 10 === 0) {
      return '중간 계산 오류';
    }

    if (diff % 9 === 0 || diff % 8 === 0 || diff % 7 === 0) {
      return '구구단 오류';
    }

    return '기타 단순 오답';
  }

  // 5. Evaluate Mastery Level
  public static calculateMastery(
    correctCount: number,
    wrongCount: number,
    advancedSolved: number,
    challengeSolved: number
  ): MasteryLevel {
    const total = correctCount + wrongCount;
    if (total === 0) return '보충';

    const accuracy = correctCount / total;

    if (accuracy >= 0.9 && (advancedSolved >= 2 || challengeSolved >= 1)) {
      return '완전정복';
    }
    if (accuracy >= 0.8 || advancedSolved >= 1) {
      return '심화';
    }
    if (accuracy >= 0.6) {
      return '기본';
    }
    return '보충';
  }
}
