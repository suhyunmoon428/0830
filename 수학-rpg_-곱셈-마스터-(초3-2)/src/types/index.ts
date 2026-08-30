// Data contracts and TypeScript definitions for Math RPG

export type JobType = 'warrior' | 'wizard' | 'healer' | 'explorer';

export type MasteryLevel = '보충' | '기본' | '심화' | '완전정복';

export type ErrorType = 
  | '구구단 오류'
  | '일의 자리 계산 오류'
  | '올림 누락'
  | '자릿값 오류'
  | '중간 계산 오류'
  | '두 자리 수 곱셈 자리 정렬 오류'
  | '덧셈 오류'
  | '어림 판단 오류'
  | '기타 단순 오답';

export interface StudentAccount {
  id: string; // e.g. "3-3-01"
  password: string; // e.g. "1234"
  grade: number;
  classNo: number;
  number: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterAppearance {
  base: string; // e.g. 'avatar_1', 'avatar_2', 'avatar_3', 'avatar_4'
  hairStyle: string; // 'short', 'twin', 'long', 'spiky'
  hairColor: string; // '#4B5563', '#92400E', '#F59E0B', '#3B82F6', '#EF4444'
  outfit: string; // 'apprentice', 'adventurer', 'scholar', 'royal'
}

export interface CharacterData {
  nickname: string;
  job: JobType;
  level: number;
  exp: number;
  gold: number;
  appearance: CharacterAppearance;
  inventory: string[]; // List of item IDs owned
  equipment: Record<string, string | null>; // slot -> item ID (e.g. weapon, armor, hat, accessory, pet, title)
  skills: string[]; // List of unlocked skill IDs
  mathMonsters: string[]; // List of collected monster IDs
  titles: string[]; // List of earned titles
  praiseStickers?: number;
}

export interface WrongQuestionRecord {
  problemId: string;
  stageId: number;
  problem: string;
  studentAns: string;
  correctAns: string;
  errorType?: ErrorType;
  retryCount: number;
  hintLevel: number;
  createdAt: string;
}

export interface StageRecord {
  stageId: number;
  completed: boolean;
  mastery: MasteryLevel;
  score: number;
  correctCount: number;
  wrongCount: number;
  tryCount: number;
  hintCount: number;
  basicSolved: number;
  advancedSolved: number;
  challengeSolved: number;
  applicationSolved: number;
  createdProblems: number;
  wrongQuestions: WrongQuestionRecord[];
  updatedAt: string;
}

export interface StudentAiAssessment {
  text: string;
  summaryTraits: string; // e.g. "개념 이해 및 심화 추론 우수"
  profileCategory?: 'HIGH_ACCURACY_ADVANCED' | 'DIVERSE_STRATEGIES' | 'GROWTH_IMPROVEMENT' | 'SELF_CORRECTION_RESILIENCE' | 'CREATIVE_PROBLEM_SOLVER' | 'DILIGENT_BASIC_MASTERY';
  generatedAt: string;
  isCustomEdited?: boolean;
  modelUsed?: string;
  history?: Array<{
    text: string;
    generatedAt: string;
  }>;
}

export interface StudentData {
  schemaVersion: number;
  account: StudentAccount;
  character: CharacterData;
  stages: Record<number, StageRecord>;
  totalCorrect: number;
  totalWrong: number;
  totalHints: number;
  totalRetries: number;
  aiAssessment?: StudentAiAssessment;
  lastLearningAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSettings {
  password: string; // default "0000"
  defaultGrade: number;
  defaultClassNo: number;
  gasWebAppUrl?: string;
  autoSync?: boolean;
  lastSyncedAt?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
  updatedAt: string;
}

export interface GasStageSubmission {
  submissionId: string;
  submittedAt: string;
  grade: number;
  classNo: number;
  number: number;
  name: string;
  id: string;
  job: string;
  level: number;
  stageId: number;
  stageTitle: string;
  mastery: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  accuracyRate: number;
  tryCount: number;
  hintCount: number;
  errorType: string;
  wrongQuestions?: WrongQuestionRecord[];
  wrongDetails?: string;
  gold: number;
  exp: number;
  praiseStickers: number;
  remarks?: string;
  mode?: 'update' | 'append';
}

export interface GasRecord {
  _rowNumber?: number;
  제출일시?: string;
  학년?: number | string;
  반?: number | string;
  번호?: number | string;
  이름?: string;
  학생아이디?: string;
  직업?: string;
  레벨?: number | string;
  차시?: number | string;
  차시명?: string;
  성취수준?: string;
  점수?: number | string;
  정답수?: number | string;
  오답수?: number | string;
  '정답률(%)'?: number | string;
  도전횟수?: number | string;
  힌트사용수?: number | string;
  주요오류유형?: string;
  오답상세?: any;
  획득골드?: number | string;
  획득경험치?: number | string;
  칭찬스티커?: number | string;
  비고?: string;
  [key: string]: any;
}

export interface GasApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  row?: number;
  isUpdated?: boolean;
  total?: number;
  records?: GasRecord[];
  savedAt?: string;
  [key: string]: any;
}

export interface GasConnectionTestResult {
  success: boolean;
  status: 'idle' | 'testing' | 'success' | 'failed';
  url: string;
  latencyMs: number;
  canGet: boolean;
  canPost: boolean;
  recordCount: number;
  message: string;
  errorDetails?: string;
  testedAt: string;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'weapon' | 'shield' | 'armor' | 'hat' | 'accessory' | 'pet' | 'title' | 'background';
  jobRequired?: JobType;
  price: number;
  description: string;
  icon: string;
  effectDescription?: string;
  isRare?: boolean;
  unlockCondition?: string;
}

export interface MathSkill {
  id: string;
  name: string;
  job: JobType;
  requiredLevel: number;
  icon: string;
  description: string;
  effectType: 'highlight' | 'shield' | 'combo' | 'decompose' | 'grid' | 'supplementary' | 'warning' | 'guide';
}

export interface MathMonster {
  id: string;
  stageId: number;
  name: string;
  title: string;
  element: string;
  description: string;
  imageEmoji: string;
  unlockedAtStage: number;
  isRare?: boolean;
  concept?: string;
  lore?: string;
  unlockHint?: string;
}

export interface ProblemOption {
  label: string;
  value: string;
}

export interface MathProblem {
  id: string;
  stageId: number;
  number: number; // 1 to 15 or 16+ for infinite
  title: string;
  question: string;
  type: 'standard' | 'vertical' | 'multiple_choice' | 'word_problem' | 'puzzle' | 'speed' | 'boss';
  a: number;
  b: number;
  c?: number;
  answer: string;
  options?: ProblemOption[]; // For multiple choice / speed estimate
  hint1: string; // 1st try: conceptual reminder
  hint2: string; // 2nd try: calculation order / strategy
  hint3: {
    text: string;
    visualType?: 'base10' | 'grid' | 'steps' | 'area';
    data?: any;
  };
  explanation: string;
  difficulty: '기본' | '심화' | '도전' | '보충';
  errorAnalysisRules?: {
    checkOrder?: string;
  };
}

export interface StageInfo {
  id: number;
  title: string;
  subtitle: string;
  worldName: string;
  curriculumDesc: string;
  iconName: string;
  monsterId: string;
  bossMonster?: string;
  minLevel: number;
}
