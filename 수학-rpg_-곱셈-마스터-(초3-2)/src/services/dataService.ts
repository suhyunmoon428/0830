import { StorageAdapter } from './storageAdapter';
import { 
  StudentAccount, 
  StudentData, 
  TeacherSettings, 
  StageRecord, 
  JobType
} from '../types';

const STORAGE_KEYS = {
  STUDENTS: 'students_db_v1',
  TEACHER_SETTINGS: 'teacher_settings_v1',
  CURRENT_STUDENT_ID: 'session_current_student_id',
  TEACHER_AUTH: 'session_teacher_auth',
};

// Default initial teacher settings
const DEFAULT_TEACHER_SETTINGS: TeacherSettings = {
  password: '0000',
  defaultGrade: 3,
  defaultClassNo: 3,
  updatedAt: new Date().toISOString(),
};

// Default 3 starter student accounts
const DEFAULT_STARTER_STUDENTS: StudentData[] = [
  createDefaultStudentProfile({
    id: '3-3-01',
    password: '1234',
    grade: 3,
    classNo: 3,
    number: 1,
    name: '김민준',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, 'warrior', '민준용사'),
  createDefaultStudentProfile({
    id: '3-3-02',
    password: '1234',
    grade: 3,
    classNo: 3,
    number: 2,
    name: '이서연',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, 'wizard', '서연마법사'),
  createDefaultStudentProfile({
    id: '3-3-03',
    password: '1234',
    grade: 3,
    classNo: 3,
    number: 3,
    name: '박도현',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, 'explorer', '도현탐험가'),
];

export function createDefaultStudentProfile(
  account: StudentAccount,
  job: JobType = 'warrior',
  nickname = ''
): StudentData {
  const initialStages: Record<number, StageRecord> = {};
  for (let i = 1; i <= 12; i++) {
    initialStages[i] = {
      stageId: i,
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
  }

  return {
    schemaVersion: 1,
    account,
    character: {
      nickname: nickname || account.name || '모험가',
      job,
      level: 1,
      exp: 0,
      gold: 50,
      appearance: {
        base: 'avatar_1',
        hairStyle: 'short',
        hairColor: '#4B5563',
        outfit: 'apprentice',
      },
      inventory: [],
      equipment: {
        weapon: null,
        shield: null,
        armor: null,
        hat: null,
        accessory: null,
        pet: null,
        title: null,
        background: null,
      },
      skills: job === 'warrior' ? ['skill_w_1'] : job === 'wizard' ? ['skill_m_1'] : job === 'healer' ? ['skill_h_1'] : ['skill_e_1'],
      mathMonsters: [],
      titles: ['초보 모험가'],
      praiseStickers: 0,
    },
    stages: initialStages,
    totalCorrect: 0,
    totalWrong: 0,
    totalHints: 0,
    totalRetries: 0,
    createdAt: account.createdAt || new Date().toISOString(),
    updatedAt: account.updatedAt || new Date().toISOString(),
  };
}

export class DataService {
  // 1. Data Schema Migration
  public static migrateStudentData(raw: any): StudentData {
    if (!raw) return createDefaultStudentProfile({
      id: '3-3-01',
      password: '1234',
      grade: 3,
      classNo: 3,
      number: 1,
      name: '학생',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const account: StudentAccount = {
      id: raw.account?.id || raw.id || '3-3-01',
      password: raw.account?.password || '1234',
      grade: raw.account?.grade || 3,
      classNo: raw.account?.classNo || 3,
      number: raw.account?.number || 1,
      name: raw.account?.name || '학생',
      createdAt: raw.account?.createdAt || new Date().toISOString(),
      updatedAt: raw.account?.updatedAt || new Date().toISOString(),
    };

    const character = {
      nickname: raw.character?.nickname || account.name || '모험가',
      job: raw.character?.job || 'warrior',
      level: raw.character?.level || 1,
      exp: raw.character?.exp || 0,
      gold: raw.character?.gold !== undefined ? raw.character.gold : 50,
      appearance: {
        base: raw.character?.appearance?.base || 'avatar_1',
        hairStyle: raw.character?.appearance?.hairStyle || 'short',
        hairColor: raw.character?.appearance?.hairColor || '#4B5563',
        outfit: raw.character?.appearance?.outfit || 'apprentice',
      },
      inventory: Array.isArray(raw.character?.inventory) ? raw.character.inventory : [],
      equipment: raw.character?.equipment || {
        weapon: null,
        shield: null,
        armor: null,
        hat: null,
        accessory: null,
        pet: null,
        title: null,
        background: null,
      },
      skills: Array.isArray(raw.character?.skills) ? raw.character.skills : ['skill_w_1'],
      mathMonsters: Array.isArray(raw.character?.mathMonsters) ? raw.character.mathMonsters : [],
      titles: Array.isArray(raw.character?.titles) ? raw.character.titles : ['초보 모험가'],
      praiseStickers: raw.character?.praiseStickers || 0,
    };

    const stages: Record<number, StageRecord> = {};
    for (let i = 1; i <= 12; i++) {
      const existing = raw.stages?.[i] || raw.stages?.[String(i)];
      stages[i] = {
        stageId: i,
        completed: existing?.completed || false,
        mastery: existing?.mastery || '보충',
        score: existing?.score || 0,
        correctCount: existing?.correctCount || 0,
        wrongCount: existing?.wrongCount || 0,
        tryCount: existing?.tryCount || 0,
        hintCount: existing?.hintCount || 0,
        basicSolved: existing?.basicSolved || 0,
        advancedSolved: existing?.advancedSolved || 0,
        challengeSolved: existing?.challengeSolved || 0,
        applicationSolved: existing?.applicationSolved || 0,
        createdProblems: existing?.createdProblems || 0,
        wrongQuestions: Array.isArray(existing?.wrongQuestions) ? existing.wrongQuestions : [],
        updatedAt: existing?.updatedAt || new Date().toISOString(),
      };
    }

    return {
      schemaVersion: StorageAdapter.getSchemaVersion(),
      account,
      character,
      stages,
      totalCorrect: raw.totalCorrect || 0,
      totalWrong: raw.totalWrong || 0,
      totalHints: raw.totalHints || 0,
      totalRetries: raw.totalRetries || 0,
      lastLearningAt: raw.lastLearningAt,
      createdAt: raw.createdAt || account.createdAt,
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  // 2. Student Accounts & DB
  public static getAllStudents(): StudentData[] {
    const rawList = StorageAdapter.getItem<any[]>(STORAGE_KEYS.STUDENTS, []);
    if (!rawList || rawList.length === 0) {
      this.saveAllStudents(DEFAULT_STARTER_STUDENTS);
      return DEFAULT_STARTER_STUDENTS;
    }
    return rawList.map((item) => this.migrateStudentData(item));
  }

  public static saveAllStudents(students: StudentData[]): void {
    StorageAdapter.setItem(STORAGE_KEYS.STUDENTS, students);
  }

  public static getStudentData(studentId: string): StudentData | null {
    const all = this.getAllStudents();
    const found = all.find((s) => s.account.id === studentId.trim());
    return found ? this.migrateStudentData(found) : null;
  }

  public static getStudentAccount(studentId: string): StudentAccount | null {
    const data = this.getStudentData(studentId);
    return data ? data.account : null;
  }

  public static saveStudentData(studentData: StudentData): void {
    const all = this.getAllStudents();
    const index = all.findIndex((s) => s.account.id === studentData.account.id);
    studentData.updatedAt = new Date().toISOString();
    
    if (index >= 0) {
      all[index] = studentData;
    } else {
      all.push(studentData);
    }
    this.saveAllStudents(all);
  }

  public static updateStudentData(studentId: string, updates: Partial<StudentData>): void {
    const current = this.getStudentData(studentId);
    if (!current) return;
    const merged: StudentData = {
      ...current,
      ...updates,
      account: { ...current.account, ...(updates.account || {}) },
      character: { ...current.character, ...(updates.character || {}) },
      stages: { ...current.stages, ...(updates.stages || {}) },
      updatedAt: new Date().toISOString(),
    };
    this.saveStudentData(merged);
  }

  public static createStudentAccount(account: StudentAccount): StudentData {
    const all = this.getAllStudents();
    const exists = all.some((s) => s.account.id === account.id);
    if (exists) {
      throw new Error(`이미 존재하는 학생 아이디입니다: ${account.id}`);
    }
    const newStudent = createDefaultStudentProfile(account);
    all.push(newStudent);
    this.saveAllStudents(all);
    return newStudent;
  }

  public static updateStudentAccount(account: StudentAccount): void {
    const student = this.getStudentData(account.id);
    if (!student) return;
    student.account = { ...student.account, ...account, updatedAt: new Date().toISOString() };
    this.saveStudentData(student);
  }

  public static deleteStudentAccount(studentId: string): void {
    const all = this.getAllStudents().filter((s) => s.account.id !== studentId);
    this.saveAllStudents(all);
  }

  // 3. Stage Progress Helper
  public static getStageProgress(studentId: string, stageId: number): StageRecord | null {
    const student = this.getStudentData(studentId);
    if (!student || !student.stages[stageId]) return null;
    return student.stages[stageId];
  }

  public static updateStageProgress(
    studentId: string,
    stageId: number,
    progress: Partial<StageRecord>
  ): void {
    const student = this.getStudentData(studentId);
    if (!student) return;

    const currentStage = student.stages[stageId] || {
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

    student.stages[stageId] = {
      ...currentStage,
      ...progress,
      updatedAt: new Date().toISOString(),
    };

    student.lastLearningAt = new Date().toISOString();
    this.saveStudentData(student);
  }

  // 4. Reset helpers
  public static resetStudentLearningData(studentId: string): void {
    const student = this.getStudentData(studentId);
    if (!student) return;
    const clean = createDefaultStudentProfile(student.account, student.character.job, student.character.nickname);
    clean.character = {
      ...clean.character,
      appearance: student.character.appearance,
    };
    this.saveStudentData(clean);
  }

  public static resetClassLearningData(): void {
    const all = this.getAllStudents();
    const updated = all.map((s) => {
      const clean = createDefaultStudentProfile(s.account, s.character.job, s.character.nickname);
      clean.character.appearance = s.character.appearance;
      return clean;
    });
    this.saveAllStudents(updated);
  }

  public static resetAllClassData(): void {
    StorageAdapter.clearWithPrefix();
    this.saveAllStudents(DEFAULT_STARTER_STUDENTS);
    this.saveTeacherSettings(DEFAULT_TEACHER_SETTINGS);
  }

  // 5. Teacher Settings
  public static getTeacherSettings(): TeacherSettings {
    return StorageAdapter.getItem<TeacherSettings>(
      STORAGE_KEYS.TEACHER_SETTINGS,
      DEFAULT_TEACHER_SETTINGS
    );
  }

  public static saveTeacherSettings(settings: TeacherSettings): void {
    settings.updatedAt = new Date().toISOString();
    StorageAdapter.setItem(STORAGE_KEYS.TEACHER_SETTINGS, settings);
  }

  // 6. Session Persistence (client state helper)
  public static getCurrentStudentId(): string | null {
    return StorageAdapter.getItem<string | null>(STORAGE_KEYS.CURRENT_STUDENT_ID, null);
  }

  public static setCurrentStudentId(studentId: string | null): void {
    if (studentId === null) {
      StorageAdapter.removeItem(STORAGE_KEYS.CURRENT_STUDENT_ID);
    } else {
      StorageAdapter.setItem(STORAGE_KEYS.CURRENT_STUDENT_ID, studentId);
    }
  }

  public static isTeacherLoggedIn(): boolean {
    return StorageAdapter.getItem<boolean>(STORAGE_KEYS.TEACHER_AUTH, false);
  }

  public static setTeacherLoggedIn(isAuth: boolean): void {
    StorageAdapter.setItem(STORAGE_KEYS.TEACHER_AUTH, isAuth);
  }

  // 7. Seed Demo Data (15 realistic students with diverse profiles)
  public static seedDemoData(): void {
    const demoNames = [
      { name: '김민준', job: 'warrior' as JobType, nick: '불꽃검객', tier: 'advanced' },
      { name: '이서연', job: 'wizard' as JobType, nick: '지혜의마법사', tier: 'advanced' },
      { name: '박도현', job: 'explorer' as JobType, nick: '바람의화살', tier: 'average' },
      { name: '최지우', job: 'healer' as JobType, nick: '빛의수호자', tier: 'average' },
      { name: '정예준', job: 'warrior' as JobType, nick: '철벽의용사', tier: 'struggling' },
      { name: '윤하은', job: 'wizard' as JobType, nick: '별빛소녀', tier: 'average' },
      { name: '한시우', job: 'explorer' as JobType, nick: '미로개척자', tier: 'advanced' },
      { name: '강서아', job: 'healer' as JobType, nick: '따뜻한손길', tier: 'average' },
      { name: '조유찬', job: 'warrior' as JobType, nick: '용맹한사자', tier: 'struggling' },
      { name: '임수아', job: 'wizard' as JobType, nick: '마법연구원', tier: 'struggling' },
      { name: '송지호', job: 'explorer' as JobType, nick: '나침반소년', tier: 'average' },
      { name: '오다은', job: 'healer' as JobType, nick: '천사의날개', tier: 'advanced' },
      { name: '신건우', job: 'warrior' as JobType, nick: '황금기사', tier: 'average' },
      { name: '배서진', job: 'wizard' as JobType, nick: '비전의현자', tier: 'average' },
      { name: '백하린', job: 'explorer' as JobType, nick: '숲의탐험가', tier: 'struggling' },
    ];

    const demoStudents: StudentData[] = demoNames.map((d, index) => {
      const num = index + 1;
      const id = `3-3-${num < 10 ? '0' + num : num}`;
      const account: StudentAccount = {
        id,
        password: '1234',
        grade: 3,
        classNo: 3,
        number: num,
        name: d.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const student = createDefaultStudentProfile(account, d.job, d.nick);

      if (d.tier === 'advanced') {
        student.character.level = 14 + (index % 5);
        student.character.exp = 240;
        student.character.gold = 350;
        student.character.mathMonsters = ['monster_1', 'monster_2', 'monster_3', 'monster_4', 'monster_5', 'monster_6', 'monster_7', 'monster_8'];
        student.character.inventory = ['item_w_2', 'item_c_glasses_1', 'item_c_pet_slime'];
        student.character.equipment.weapon = d.job === 'warrior' ? 'item_w_2' : null;
        student.character.equipment.accessory = 'item_c_glasses_1';
        student.character.equipment.pet = 'item_c_pet_slime';
        student.totalCorrect = 95 + index * 3;
        student.totalWrong = 8;
        student.totalHints = 6;
        student.totalRetries = 5;

        for (let s = 1; s <= 8; s++) {
          student.stages[s].completed = true;
          student.stages[s].mastery = s <= 6 ? '완전정복' : '심화';
          student.stages[s].score = 95;
          student.stages[s].correctCount = 15;
          student.stages[s].wrongCount = 1;
          student.stages[s].basicSolved = 15;
          student.stages[s].advancedSolved = 4;
          student.stages[s].challengeSolved = 2;
        }
      } else if (d.tier === 'average') {
        student.character.level = 6 + (index % 4);
        student.character.exp = 110;
        student.character.gold = 160;
        student.character.mathMonsters = ['monster_1', 'monster_2', 'monster_3', 'monster_4'];
        student.character.inventory = ['item_c_pet_slime'];
        student.character.equipment.pet = 'item_c_pet_slime';
        student.totalCorrect = 55 + index * 2;
        student.totalWrong = 16;
        student.totalHints = 14;
        student.totalRetries = 12;

        for (let s = 1; s <= 5; s++) {
          student.stages[s].completed = true;
          student.stages[s].mastery = s <= 3 ? '기본' : '보충';
          student.stages[s].score = 75;
          student.stages[s].correctCount = 12;
          student.stages[s].wrongCount = 4;
          student.stages[s].basicSolved = 12;
        }
      } else {
        // Struggling / SOS candidate
        student.character.level = 3;
        student.character.exp = 40;
        student.character.gold = 80;
        student.character.mathMonsters = ['monster_1', 'monster_2'];
        student.totalCorrect = 25;
        student.totalWrong = 28;
        student.totalHints = 24;
        student.totalRetries = 20;

        for (let s = 1; s <= 3; s++) {
          student.stages[s].completed = s <= 2;
          student.stages[s].mastery = '보충';
          student.stages[s].score = 45;
          student.stages[s].correctCount = 7;
          student.stages[s].wrongCount = 9;
          student.stages[s].hintCount = 10;
          student.stages[s].wrongQuestions = [
            {
              problemId: `p_s${s}_3`,
              stageId: s,
              problem: s === 3 ? '118 × 4' : '271 × 3',
              studentAns: '442',
              correctAns: '472',
              errorType: '올림 누락',
              retryCount: 3,
              hintLevel: 3,
              createdAt: new Date().toISOString(),
            },
            {
              problemId: `p_s${s}_7`,
              stageId: s,
              problem: '319 × 3',
              studentAns: '937',
              correctAns: '957',
              errorType: '일의 자리 계산 오류',
              retryCount: 2,
              hintLevel: 2,
              createdAt: new Date().toISOString(),
            },
          ];
        }
      }

      return student;
    });

    this.saveAllStudents(demoStudents);
  }

  // Alias for demo seeding
  public static seedDemoClassData(): void {
    this.seedDemoData();
  }

  // Create a single new student
  public static createStudent(params: {
    number: number;
    name: string;
    id: string;
    password?: string;
    job?: JobType;
  }): StudentData {
    const newStudent = createDefaultStudentProfile(
      {
        id: params.id,
        password: params.password || '1234',
        grade: 3,
        classNo: 3,
        number: params.number,
        name: params.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      params.job || 'warrior',
      params.name
    );

    const students = this.getAllStudents();
    students.push(newStudent);
    this.saveAllStudents(students);
    return newStudent;
  }

  // Bulk create students
  public static bulkCreateStudents(count: number): StudentData[] {
    const currentStudents = this.getAllStudents();
    const existingIds = new Set(currentStudents.map((s) => s.account.id));
    const jobs: JobType[] = ['warrior', 'wizard', 'healer', 'explorer'];
    const added: StudentData[] = [];

    for (let i = 1; i <= count; i++) {
      const paddedNum = i.toString().padStart(2, '0');
      const studentId = `3-3-${paddedNum}`;
      if (!existingIds.has(studentId)) {
        const student = createDefaultStudentProfile(
          {
            id: studentId,
            password: '1234',
            grade: 3,
            classNo: 3,
            number: i,
            name: `${i}번 학생`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          jobs[(i - 1) % jobs.length],
          `${i}번 모험가`
        );
        currentStudents.push(student);
        added.push(student);
      }
    }

    this.saveAllStudents(currentStudents);
    return added;
  }

  // Reset student password
  public static resetStudentPassword(studentId: string, newPw = '1234'): boolean {
    const student = this.getStudentData(studentId);
    if (!student) return false;
    student.account.password = newPw;
    student.account.updatedAt = new Date().toISOString();
    this.saveStudentData(student);
    return true;
  }

  // Reset learning data only (keeps student accounts)
  public static resetLearningDataOnly(): void {
    const students = this.getAllStudents();
    const resetList = students.map((st) => {
      const fresh = createDefaultStudentProfile(st.account, st.character.job, st.character.nickname);
      fresh.character.inventory = [];
      fresh.character.equipment = {
        weapon: null,
        shield: null,
        armor: null,
        hat: null,
        accessory: null,
        pet: null,
        title: null,
        background: null,
      };
      fresh.character.mathMonsters = [];
      fresh.character.praiseStickers = 0;
      return fresh;
    });
    this.saveAllStudents(resetList);
  }

  // Reset all data completely
  public static resetAllData(): void {
    StorageAdapter.removeItem(STORAGE_KEYS.STUDENTS);
    StorageAdapter.removeItem(STORAGE_KEYS.TEACHER_SETTINGS);
    StorageAdapter.removeItem(STORAGE_KEYS.CURRENT_STUDENT_ID);
    this.saveAllStudents(DEFAULT_STARTER_STUDENTS);
  }

  // Verify teacher password
  public static verifyTeacherPassword(password: string): boolean {
    const settings = this.getTeacherSettings();
    return settings.password === password.trim();
  }

  // Set teacher password
  public static setTeacherPassword(newPassword: string): void {
    const settings = this.getTeacherSettings();
    settings.password = newPassword.trim();
    settings.updatedAt = new Date().toISOString();
    StorageAdapter.setItem(STORAGE_KEYS.TEACHER_SETTINGS, settings);
  }
}
