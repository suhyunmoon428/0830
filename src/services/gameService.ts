import { DataService } from './dataService';
import { getExpNeededForNextLevel, SHOP_ITEMS, MATH_SKILLS, MATH_MONSTERS } from '../data/gameData';
import { StudentData, JobType, ShopItem, MathSkill } from '../types';

export interface RewardResult {
  expGained: number;
  goldGained: number;
  isLevelUp: boolean;
  newLevel: number;
  unlockedSkills: MathSkill[];
  unlockedMonster?: string;
  unlockedRareItem?: ShopItem;
  bonusMessage?: string;
}

export class GameService {
  // 1. Calculate and Award Problem Rewards
  public static awardProblemReward(
    studentId: string,
    params: {
      isCorrect: boolean;
      difficulty: '기본' | '심화' | '도전' | '보충';
      comboCount: number;
      isSpeed: boolean;
      isRetry: boolean;
      stageId: number;
      isBoss?: boolean;
    }
  ): RewardResult {
    const student = DataService.getStudentData(studentId);
    if (!student) {
      return { expGained: 0, goldGained: 0, isLevelUp: false, newLevel: 1, unlockedSkills: [] };
    }

    if (!params.isCorrect) {
      return { expGained: 0, goldGained: 0, isLevelUp: false, newLevel: student.character.level, unlockedSkills: [] };
    }

    let exp = 10;
    let gold = 5;
    let bonusMsg = '';

    // Difficulty scaling
    if (params.difficulty === '심화') {
      exp += 15;
      gold += 10;
    } else if (params.difficulty === '도전' || params.isBoss) {
      exp += 30;
      gold += 20;
    } else if (params.difficulty === '보충') {
      exp += 5;
      gold += 3;
    }

    // Combo streak bonus
    if (params.comboCount >= 3) {
      const comboBonus = Math.min(params.comboCount * 3, 20);
      exp += comboBonus;
      gold += 5;
      bonusMsg = `${params.comboCount}연속 정답 콤보 보너스!`;
    }

    // Job Trait Bonuses
    const job = student.character.job;
    if (job === 'warrior') {
      if (params.comboCount >= 2 || params.isSpeed) {
        exp = Math.round(exp * 1.3);
        gold += 3;
        bonusMsg = '⚔️ 전사 직업 특성: 연속 공격 보너스!';
      }
    } else if (job === 'wizard') {
      if (params.difficulty === '심화' || params.difficulty === '도전') {
        exp = Math.round(exp * 1.4);
        gold += 5;
        bonusMsg = '🔮 마법사 직업 특성: 심화 탐구 보너스!';
      }
    } else if (job === 'healer') {
      if (params.isRetry || params.difficulty === '보충') {
        exp = Math.round(exp * 2.0); // Healer gets 2x for retry & recovery!
        gold += 4;
        bonusMsg = '💖 힐러 직업 특성: 오답 극복 치유 보너스!';
      }
    } else if (job === 'explorer') {
      if (params.stageId >= 9 || params.difficulty === '도전') {
        exp = Math.round(exp * 1.35);
        gold += 4;
        bonusMsg = '🏹 탐험가 직업 특성: 미지 개척 보너스!';
      }
    }

    // Apply gains
    student.character.exp += exp;
    student.character.gold += gold;

    // Check Level Up
    let isLevelUp = false;
    const oldLevel = student.character.level;
    let neededExp = getExpNeededForNextLevel(student.character.level);

    while (student.character.exp >= neededExp && student.character.level < 30) {
      student.character.exp -= neededExp;
      student.character.level += 1;
      isLevelUp = true;
      neededExp = getExpNeededForNextLevel(student.character.level);
    }

    // Check new skills unlocked
    const newUnlockedSkills: MathSkill[] = [];
    if (isLevelUp) {
      const jobSkills = MATH_SKILLS.filter((s) => s.job === job && s.requiredLevel <= student.character.level);
      jobSkills.forEach((s) => {
        if (!student.character.skills.includes(s.id)) {
          student.character.skills.push(s.id);
          newUnlockedSkills.push(s);
        }
      });
    }

    DataService.saveStudentData(student);

    return {
      expGained: exp,
      goldGained: gold,
      isLevelUp,
      newLevel: student.character.level,
      unlockedSkills: newUnlockedSkills,
      bonusMessage: bonusMsg,
    };
  }

  // 2. Award Stage Completion Rewards
  public static awardStageClear(
    studentId: string,
    stageId: number
  ): { monsterUnlocked?: string; rareUnlocked?: string } {
    const student = DataService.getStudentData(studentId);
    if (!student) return {};

    const monster = MATH_MONSTERS.find((m) => m.stageId === stageId && !m.isRare);
    let monsterUnlocked: string | undefined = undefined;

    if (monster && !student.character.mathMonsters.includes(monster.id)) {
      student.character.mathMonsters.push(monster.id);
      monsterUnlocked = monster.name;
    }

    // Stage completion Gold & EXP
    student.character.exp += 80;
    student.character.gold += 50;

    // Check rare unlocks
    let rareUnlocked: string | undefined = undefined;
    if (stageId === 12 && !student.character.inventory.includes('rare_crown_explorer')) {
      student.character.inventory.push('rare_crown_explorer');
      rareUnlocked = '수학 탐험가 왕관';
    }

    DataService.saveStudentData(student);
    return { monsterUnlocked, rareUnlocked };
  }

  // 3. Shop Purchase
  public static purchaseItem(
    studentId: string,
    itemId: string
  ): { success: boolean; message: string; student?: StudentData } {
    const student = DataService.getStudentData(studentId);
    if (!student) return { success: false, message: '학생 정보를 찾을 수 없습니다.' };

    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return { success: false, message: '아이템을 찾을 수 없습니다.' };

    if (student.character.inventory.includes(itemId)) {
      return { success: false, message: '이미 보유 중인 아이템입니다.' };
    }

    if (item.jobRequired && item.jobRequired !== student.character.job) {
      return { success: false, message: '해당 직업 전용 아이템입니다.' };
    }

    if (student.character.gold < item.price) {
      return {
        success: false,
        message: `골드가 부족합니다! (필요: ${item.price} Gold, 보유: ${student.character.gold} Gold)`,
      };
    }

    // Deduct Gold and add to Inventory
    student.character.gold -= item.price;
    student.character.inventory.push(itemId);

    // Auto-equip if slot is empty
    const slot = item.category;
    if (student.character.equipment[slot] === null || student.character.equipment[slot] === undefined) {
      student.character.equipment[slot] = itemId;
    }

    DataService.saveStudentData(student);
    return {
      success: true,
      message: `${item.name}을(를) 구매하여 인벤토리에 보관했습니다!`,
      student,
    };
  }

  // 4. Equipment Toggle
  public static toggleEquipItem(
    studentId: string,
    itemId: string
  ): { success: boolean; equipped: boolean; message: string } {
    const student = DataService.getStudentData(studentId);
    if (!student) return { success: false, equipped: false, message: '학생을 찾을 수 없습니다.' };

    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return { success: false, equipped: false, message: '아이템 정보가 없습니다.' };

    const slot = item.category;
    const currentEquipped = student.character.equipment[slot];

    if (currentEquipped === itemId) {
      // Unequip
      student.character.equipment[slot] = null;
      DataService.saveStudentData(student);
      return { success: true, equipped: false, message: `${item.name} 장착을 해제했습니다.` };
    } else {
      // Equip
      student.character.equipment[slot] = itemId;
      DataService.saveStudentData(student);
      return { success: true, equipped: true, message: `${item.name}을(를) 장착했습니다!` };
    }
  }

  // 5. Teacher Instant Rewards
  public static grantTeacherReward(
    studentId: string,
    rewardType: 'sticker' | 'exp50' | 'gold50' | 'title_master' | 'item_praise'
  ): { success: boolean; message: string; updatedStudent?: StudentData } {
    const student = DataService.getStudentData(studentId);
    if (!student) return { success: false, message: '학생을 찾을 수 없습니다.' };

    let msg = '';
    switch (rewardType) {
      case 'sticker':
        student.character.praiseStickers = (student.character.praiseStickers || 0) + 1;
        student.character.exp += 30;
        student.character.gold += 20;
        msg = `칭찬 스티커 1개와 보너스 EXP/Gold를 지급했습니다!`;
        break;
      case 'exp50':
        student.character.exp += 50;
        let neededExp = getExpNeededForNextLevel(student.character.level);
        while (student.character.exp >= neededExp && student.character.level < 30) {
          student.character.exp -= neededExp;
          student.character.level += 1;
          neededExp = getExpNeededForNextLevel(student.character.level);
        }
        msg = `+50 EXP를 지급했습니다. (현재 레벨: Lv.${student.character.level})`;
        break;
      case 'gold50':
        student.character.gold += 50;
        msg = `+50 Gold를 지급했습니다. (현재 골드: ${student.character.gold} Gold)`;
        break;
      case 'title_master':
        const titleName = '선생님의 자랑';
        if (!student.character.titles.includes(titleName)) {
          student.character.titles.push(titleName);
        }
        student.character.equipment.title = titleName;
        msg = `특별 칭호 [${titleName}]을(를) 수여했습니다!`;
        break;
      case 'item_praise':
        if (!student.character.inventory.includes('rare_shield_rainbow')) {
          student.character.inventory.push('rare_shield_rainbow');
        }
        student.character.equipment.shield = 'rare_shield_rainbow';
        msg = `선생님 특별 보상 아이템 [무지개 수호 방패]를 지급했습니다!`;
        break;
    }

    DataService.saveStudentData(student);
    return { success: true, message: msg, updatedStudent: student };
  }
}
