import React, { useState } from 'react';
import { StudentData, ShopItem } from '../../types';
import { SHOP_ITEMS } from '../../data/gameData';
import { GameService } from '../../services/gameService';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { 
  ArrowLeft, 
  Coins, 
  ShoppingBag, 
  Check, 
  Lock, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface ShopViewProps {
  student: StudentData;
  onBack: () => void;
  onStudentUpdated: (student: StudentData) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  student,
  onBack,
  onStudentUpdated,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('job');
  const [purchaseAlert, setPurchaseAlert] = useState<{ success: boolean; message: string } | null>(null);

  const showAlert = (success: boolean, message: string) => {
    setPurchaseAlert({ success, message });
    setTimeout(() => setPurchaseAlert(null), 3000);
  };

  const handleBuyItem = (item: ShopItem) => {
    const result = GameService.purchaseItem(student.account.id, item.id);
    if (result.success && result.student) {
      onStudentUpdated(result.student);
      showAlert(true, result.message);
    } else {
      showAlert(false, result.message);
    }
  };

  const handleToggleEquip = (item: ShopItem) => {
    const result = GameService.toggleEquipItem(student.account.id, item.id);
    if (result.success) {
      const updated = { ...student };
      const slot = item.category;
      if (result.equipped) {
        updated.character.equipment[slot] = item.id;
      } else {
        updated.character.equipment[slot] = null;
      }
      onStudentUpdated(updated);
      showAlert(true, result.message);
    }
  };

  // Filter items based on category
  const filteredItems = SHOP_ITEMS.filter((item) => {
    if (selectedCategory === 'job') {
      return item.jobRequired === student.character.job;
    }
    if (selectedCategory === 'accessory') {
      return item.category === 'accessory' || item.category === 'hat';
    }
    if (selectedCategory === 'pet') {
      return item.category === 'pet';
    }
    if (selectedCategory === 'background') {
      return item.category === 'background';
    }
    if (selectedCategory === 'rare') {
      return item.isRare;
    }
    return true;
  });

  return (
    <div id="shop-view" className="min-h-screen bg-slate-100 flex flex-col">
      {/* Shop Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              id="btn-shop-back"
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-black font-rpg text-slate-800">모험가 장비 & 꾸미기 상점</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border-2 border-amber-300 shadow-2xs">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>보유 골드: {student.character.gold} G</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Character Live Equipment Visualizer */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex flex-col items-center justify-between space-y-4">
          <div className="text-center w-full">
            <div className="text-xs font-extrabold text-slate-500 mb-2">현재 장착 상태 미리보기</div>
            <AvatarDisplay character={student.character} size="xl" showDetails={true} />
          </div>

          <div className="w-full bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="font-extrabold text-slate-700 border-b border-slate-200 pb-1 flex justify-between">
              <span>장착 슬롯</span>
              <span className="text-[10px] text-sky-600">인벤토리 {student.character.inventory.length}개 보유</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600">
              <div>무기: {student.character.equipment.weapon ? '장착 중 🗡️' : '미착용'}</div>
              <div>방패: {student.character.equipment.shield ? '장착 중 🛡️' : '미착용'}</div>
              <div>모자: {student.character.equipment.hat ? '장착 중 👑' : '미착용'}</div>
              <div>펫: {student.character.equipment.pet ? '동행 중 🐾' : '미착용'}</div>
            </div>
          </div>
        </div>

        {/* Right 2-Cols: Shop Catalog */}
        <div className="md:col-span-2 space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'job', name: '⚔️ 직업 전용 장비' },
              { id: 'accessory', name: '👓 장신구 & 모자' },
              { id: 'pet', name: '🐾 귀여운 펫' },
              { id: 'background', name: '🌌 배경 & 테두리' },
              { id: 'rare', name: '✨ 희귀 업적 보상' },
            ].map((cat) => (
              <button
                key={cat.id}
                id={`btn-shop-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Alert Notification */}
          {purchaseAlert && (
            <div
              className={`p-3 rounded-2xl text-xs font-black flex items-center gap-2 animate-fade-in ${
                purchaseAlert.success
                  ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-2 border-rose-300'
              }`}
            >
              {purchaseAlert.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{purchaseAlert.message}</span>
            </div>
          )}

          {/* Items Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const isOwned = student.character.inventory.includes(item.id);
              const isEquipped = Object.values(student.character.equipment).includes(item.id);
              const canAfford = student.character.gold >= item.price;

              return (
                <div
                  key={item.id}
                  id={`shop-item-${item.id}`}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    isEquipped
                      ? 'bg-sky-50/80 border-sky-400 shadow-xs'
                      : isOwned
                      ? 'bg-white border-emerald-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-3xl p-2 bg-slate-50 rounded-xl shadow-2xs border border-slate-200">
                        {item.icon}
                      </span>
                      <div>
                        {item.isRare ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                            <Sparkles className="w-3 h-3" />
                            업적 전설
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Coins className="w-3 h-3" />
                            {item.price} G
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-800 mb-1">{item.name}</h4>
                    <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                    {item.effectDescription && (
                      <div className="text-[11px] font-bold text-sky-700 bg-sky-50 p-1.5 rounded-lg mb-3">
                        ⚡ 효과: {item.effectDescription}
                      </div>
                    )}
                    {item.unlockCondition && (
                      <div className="text-[11px] font-bold text-purple-700 bg-purple-50 p-1.5 rounded-lg mb-3">
                        🎯 획득 조건: {item.unlockCondition}
                      </div>
                    )}
                  </div>

                  {/* Buy or Equip/Unequip Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {item.isRare ? (
                      isOwned ? (
                        <button
                          id={`btn-equip-rare-${item.id}`}
                          onClick={() => handleToggleEquip(item)}
                          className={`w-full py-2 rounded-xl text-xs font-extrabold transition-all ${
                            isEquipped
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                              : 'bg-sky-500 hover:bg-sky-600 text-white'
                          }`}
                        >
                          {isEquipped ? '장착 해제' : '장착하기'}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          미달성 (학습 도전으로 해금)
                        </span>
                      )
                    ) : isOwned ? (
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          보유 중
                        </span>
                        <button
                          id={`btn-equip-item-${item.id}`}
                          onClick={() => handleToggleEquip(item)}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                            isEquipped
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                              : 'bg-sky-500 hover:bg-sky-600 text-white shadow-xs'
                          }`}
                        >
                          {isEquipped ? '장착 해제' : '장착하기'}
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-buy-item-${item.id}`}
                        disabled={!canAfford}
                        onClick={() => handleBuyItem(item)}
                        className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 text-amber-950 shadow-xs active:scale-95'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>{canAfford ? '골드로 구매하기' : '골드 부족'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};
