import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const PORT = 3000;
const HOST = '0.0.0.0';

// Initialize Gemini lazily if API key exists
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// Fallback high-quality Korean curriculum assessment generator
function generateRuleBasedAssessment(
  studentName: string,
  profile: any,
  variationIndex = 0
): { text: string; summaryTraits: string; profileCategory: string } {
  const category = profile.profileCategory || 'DILIGENT_BASIC_MASTERY';

  const templates: Record<string, string[][]> = {
    HIGH_ACCURACY_ADVANCED: [
      [
        `곱셈의 원리와 개념을 깊이 있게 이해하고 있으며, 복잡한 문제 상황에서도 다양한 연산 전략을 유연하게 적용하여 정확하게 해결함.`,
        `심화 문제 및 도전 과제에 적극적으로 참여하여 해결 과정을 논리적으로 설명하고 수학적 추론 능력이 매우 뛰어남.`,
      ],
      [
        `세 자리 수와 두 자리 수의 곱셈 개념을 바르게 파악하고 이를 활용한 실생활 문제 해결력이 탁월함.`,
        `어려운 문제에 직면했을 때 다양한 해결 방법을 능숙하게 모색하며 수학적 사고력이 돋보임.`,
      ],
      [
        `수학적 개념 간의 관계를 빠르게 이해하고 심화 곱셈 문제를 능숙하게 해결함.`,
        `자신의 해결 방법을 논리적인 수학적 표현으로 명확하게 전달하는 능력이 뛰어남.`,
      ],
    ],
    DIVERSE_STRATEGIES: [
      [
        `문제를 해결할 때 한 가지 방식에 머무르지 않고 여러 가지 연산 전략을 탐색하며 창의적으로 접근함.`,
        `친구들과 다양한 해결 방법을 비교하고 나누는 과정에 주도적으로 참여하며 사고의 유연성이 돋보임.`,
      ],
      [
        `다양한 방법으로 문제를 해결하려는 탐구적인 태도가 돋보이며, 모둠원들과 해결 전략을 교환하며 사고의 폭을 넓혀감.`,
        `수학적 상황을 여러 각도에서 관찰하고 자신만의 방식으로 접근하여 해결하는 능력이 우수함.`,
      ],
    ],
    GROWTH_IMPROVEMENT: [
      [
        `수학 학습에 꾸준하고 성실하게 참여하며 곱셈 계산 원리와 자릿값의 개념을 점차 정확하게 이해하고 적용하는 모습이 뚜렷하게 나타남.`,
        `초기 어려웠던 단계도 포기하지 않고 성실하게 참여하여 계산 속도와 정확도가 점진적으로 향상됨.`,
      ],
      [
        `배운 내용을 성실하게 복습하고 단계별 연습을 통해 곱셈 연산 실력을 꾸준히 성장시키고 있음.`,
        `수학에 대한 자신감을 바탕으로 매 차시 과제에 집중하여 이전보다 훨씬 발전된 문제 해결력을 보임.`,
      ],
    ],
    SELF_CORRECTION_RESILIENCE: [
      [
        `어려운 문제도 포기하지 않고 재도전하며, 오답 발생 시 풀이 과정을 꼼꼼히 점검하여 스스로 오류를 찾아내고 수정하는 능력이 돋보임.`,
        `끈기 있는 태도로 문제 해결에 임하며, 피드백을 수용하여 자신의 연산 습관을 주도적으로 개선함.`,
      ],
      [
        `틀린 문제를 다시 확인하고 올림수나 자릿값 등의 오류 원인을 스스로 찾아 바르게 고치는 자기 수정 능력이 우수함.`,
        `실수를 두려워하지 않고 끝까지 문제를 해결하려는 끈기와 과제 집착력이 뛰어남.`,
      ],
    ],
    CREATIVE_PROBLEM_SOLVER: [
      [
        `문제 만들기 및 수학 퍼즐 활동에서 독창적이고 참신한 아이디어를 발휘하며 수학적 표현력과 사고력이 우수함.`,
        `배운 곱셈 원리를 실생활 속 맥락과 연결하여 새로운 문제 상황을 구성하는 창의적 문제 해결 능력이 돋보임.`,
      ],
      [
        `수학 퍼즐과 규칙 찾기 활동에 흥미를 가지고 적극적으로 참여하며, 창의적인 문제 제작 활동에서 높은 집중력을 보임.`,
        `수학적 개념을 자신만의 언어와 상황으로 재구성하여 표현하는 능력이 탁월함.`,
      ],
    ],
    DILIGENT_BASIC_MASTERY: [
      [
        `기본 곱셈 계산 원리를 바르게 이해하고 매 차시 주어진 학습 과제를 성실하고 꼼꼼하게 완수함.`,
        `수업에 집중하여 연산의 기초를 탄탄히 다지고 있으며, 정확한 풀이 습관을 지니고 있음.`,
      ],
      [
        `수학 학습 규칙을 잘 지키며 꾸준한 연습을 통해 기본적인 곱셈 연산을 안정적으로 수행함.`,
        `매 시간 차분한 태도로 학습에 참여하며 기본 개념을 문제에 성실하게 적용함.`,
      ],
    ],
  };

  const traitLabels: Record<string, string> = {
    HIGH_ACCURACY_ADVANCED: '개념 이해 및 심화 추론 우수',
    DIVERSE_STRATEGIES: '해결 전략의 다양성 및 유연한 사고',
    GROWTH_IMPROVEMENT: '성실한 학습 태도 및 점진적 실력 향상',
    SELF_CORRECTION_RESILIENCE: '자기 점검 및 끈기 있는 문제 해결',
    CREATIVE_PROBLEM_SOLVER: '수학적 사고력 및 창의적 문제 구성',
    DILIGENT_BASIC_MASTERY: '기본 계산 원리 이해 및 성실한 과제 수행',
  };

  const catTemplates = templates[category] || templates.DILIGENT_BASIC_MASTERY;
  const pickedList = catTemplates[variationIndex % catTemplates.length];
  const combinedText = pickedList.join(' ');

  return {
    text: combinedText,
    summaryTraits: traitLabels[category] || '기본 연산 원리 이해',
    profileCategory: category,
  };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // API Routes FIRST

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasOpenrouterKey: !!process.env.OPENROUTER_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // OpenRouter Key Connection Test
  app.post('/api/assessment/test-openrouter', async (req, res) => {
    const customKey = req.body?.apiKey;
    const apiKey = customKey || process.env.OPENROUTER_API_KEY;
    const model = req.body?.model || process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'OpenRouter API 키가 설정되지 않았습니다.',
      });
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'https://ai.studio',
          'X-Title': 'Math RPG Assessment Assistant',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: '연결 테스트입니다. "연결 성공"이라고 1단어로만 응답하세요.',
            },
          ],
          max_tokens: 15,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({
          success: false,
          error: `OpenRouter 통신 에러 (${response.status}): ${errText}`,
        });
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || '연결 성공';

      return res.json({
        success: true,
        message: 'OpenRouter API 연결에 성공했습니다.',
        model,
        sampleOutput: answer.trim(),
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: `연결 테스트 중 예외 발생: ${err.message}`,
      });
    }
  });

  // Single or Batch Student Assessment Generation API
  app.post('/api/assessment/generate', async (req, res) => {
    try {
      const {
        student,
        students,
        apiKey: customApiKey,
        model: customModel,
        variationIndex = 0,
        excludeTexts = [],
      } = req.body;

      const apiKey = (customApiKey || process.env.OPENROUTER_API_KEY || '').trim();
      const model = customModel || process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

      // System Prompt for Korean Elementary School Math Evaluation
      const systemPrompt = `당신은 대한민국 초등학교 3학년 수학 전담 교사이자 학교생활기록부(교과학습발달상황 및 과정중심평가) 평가 작성 전문가입니다.
학생의 실제 곱셈 단원 학습 데이터(정답률, 도달 수준, 시도 횟수, 오답 및 자기수정 과정, 보스/심화 수행, 문제 만들기/퍼즐 활동, 참여 성실도)를 종합적으로 분석하여 진정성 있고 구체적인 수학 평어를 작성해야 합니다.

[작성 원칙]
1. 분량: 한 학생당 1~2문장 (약 90~150자 내외)으로 자연스럽고 정갈하게 작성할 것.
2. 어조 및 종결어미: 학교생활기록부 표준 평어 문체 (~함, ~임, ~을 보임, ~가 돋보임, ~를 발휘함 등 명사형/서술형 종결).
3. 긍정 및 성장 중심: 학생의 실제 학습 근거에 기반하되, 부족한 점을 지적하기보다는 자기 수정 과정, 발전 가능성, 끈기 있는 노력을 부각할 것.
4. 구체성: 단순히 "수학을 잘함", "열심히 함"과 같은 모호한 표현을 금지하고, 구체적인 곱셈 원리 이해, 연산 전략, 자릿값 확인, 오류 점검, 탐구 태도 등을 명시할 것.
5. 차별화 & 다양성: 정형화된 판박이 문장을 반복하지 말고, 학생의 6가지 핵심 특성(심화추론/다양한전략/성장향상/자기수정/창의사고/기본성실)에 맞게 다채로운 어휘와 문장 구조를 사용할 것.
6. 출력 형식: 반드시 다음 JSON 형식으로만 응답할 것 (추가 설명 금지).
{
  "assessments": [
    {
      "studentId": "학생ID",
      "studentName": "학생이름",
      "summaryTraits": "핵심 특성 요약 (예: 개념 이해 및 심화 추론 우수)",
      "profileCategory": "HIGH_ACCURACY_ADVANCED | DIVERSE_STRATEGIES | GROWTH_IMPROVEMENT | SELF_CORRECTION_RESILIENCE | CREATIVE_PROBLEM_SOLVER | DILIGENT_BASIC_MASTERY",
      "text": "완성된 1~2문장의 수학 평어 문장"
    }
  ]
}`;

      // Target students array
      const targetStudents = students && Array.isArray(students) ? students : student ? [student] : [];

      if (targetStudents.length === 0) {
        return res.status(400).json({ success: false, error: '학생 데이터가 제공되지 않았습니다.' });
      }

      const userPrompt = `다음 학생(들)의 곱셈 학습 분석 데이터를 바탕으로 학교생활기록부용 맞춤형 수학 평어를 작성해주세요.
      
[분석 대상 학생 데이터]:
${JSON.stringify(targetStudents, null, 2)}

[참고 지시사항]:
- 기존 생성된 평어와의 중복을 피하기 위해 다양성을 최대화해주세요.
- 제외할 기생성 문장 목록: ${JSON.stringify(excludeTexts.slice(-10))}
- 각 학생의 번호, 성명, 진단 특성에 맞는 1~2문장의 완결된 평어를 JSON 배열로 작성하세요.`;

      let generatedAssessments: any[] = [];
      let providerUsed = 'rule-engine';

      // 1. Try OpenRouter if API key is provided
      if (apiKey) {
        try {
          const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'HTTP-Referer': 'https://ai.studio',
              'X-Title': 'Math RPG Assessment Assistant',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              response_format: { type: 'json_object' },
              temperature: 0.75 + Math.min(variationIndex * 0.05, 0.2),
              max_tokens: 2500,
            }),
          });

          if (openrouterRes.ok) {
            const data = await openrouterRes.json();
            const content = data.choices?.[0]?.message?.content || '';
            const parsed = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
            if (parsed.assessments && Array.isArray(parsed.assessments)) {
              generatedAssessments = parsed.assessments;
              providerUsed = `openrouter (${model})`;
            }
          } else {
            console.warn('[Server] OpenRouter API error status:', openrouterRes.status);
          }
        } catch (e) {
          console.warn('[Server] OpenRouter fetch failed:', e);
        }
      }

      // 2. Fallback to Gemini if OpenRouter was not used or failed
      if (generatedAssessments.length === 0) {
        const gemini = getGeminiClient();
        if (gemini) {
          try {
            const response = await gemini.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `${systemPrompt}\n\n${userPrompt}`,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.7,
              },
            });
            const text = response.text || '';
            const parsed = JSON.parse(text);
            if (parsed.assessments && Array.isArray(parsed.assessments)) {
              generatedAssessments = parsed.assessments;
              providerUsed = 'gemini-2.5-flash';
            }
          } catch (geminiErr) {
            console.warn('[Server] Gemini fallback failed:', geminiErr);
          }
        }
      }

      // 3. Fallback to High-Quality Rule Engine if AI APIs failed
      if (generatedAssessments.length === 0) {
        providerUsed = 'pedagogical-rule-engine';
        generatedAssessments = targetStudents.map((st: any, idx: number) => {
          const ruleResult = generateRuleBasedAssessment(
            st.studentName || st.account?.name || '학생',
            st,
            variationIndex + idx
          );
          return {
            studentId: st.studentId || st.account?.id || `student_${idx}`,
            studentName: st.studentName || st.account?.name || '학생',
            summaryTraits: ruleResult.summaryTraits,
            profileCategory: ruleResult.profileCategory,
            text: ruleResult.text,
          };
        });
      }

      return res.json({
        success: true,
        provider: providerUsed,
        assessments: generatedAssessments,
      });
    } catch (err: any) {
      console.error('[Server] /api/assessment/generate fatal error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || '평어 생성 중 서버 오류가 발생했습니다.',
      });
    }
  });

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Math RPG Server] Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
