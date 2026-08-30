import React from 'react';
import { CharacterData, JobType } from '../../types';
import { SHOP_ITEMS, JOB_DESCRIPTIONS } from '../../data/gameData';

interface AvatarDisplayProps {
  character: CharacterData;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDetails?: boolean;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  character,
  size = 'md',
  showDetails = false,
}) => {
  const jobInfo = JOB_DESCRIPTIONS[character.job] || JOB_DESCRIPTIONS.warrior;

  // Resolve equipped items
  const weaponItem = SHOP_ITEMS.find((i) => i.id === character.equipment.weapon);
  const petItem = SHOP_ITEMS.find((i) => i.id === character.equipment.pet);
  const accessoryItem = SHOP_ITEMS.find((i) => i.id === character.equipment.accessory);
  const hatItem = SHOP_ITEMS.find((i) => i.id === character.equipment.hat);
  const shieldItem = SHOP_ITEMS.find((i) => i.id === character.equipment.shield);

  // Avatar sizing
  const sizeClasses = {
    sm: 'w-12 h-12 text-2xl',
    md: 'w-20 h-20 text-4xl',
    lg: 'w-28 h-28 text-5xl',
    xl: 'w-36 h-36 text-6xl',
  };

  const jobAvatars: Record<JobType, string> = {
    warrior: '⚔️🧑‍🌾',
    wizard: '🔮🧙',
    healer: '💖🧑‍⚕️',
    explorer: '🏹🧗',
  };

  const bgGradients: Record<JobType, string> = {
    warrior: 'from-amber-100 to-rose-100 border-amber-400',
    wizard: 'from-sky-100 to-indigo-100 border-sky-400',
    healer: 'from-emerald-100 to-teal-100 border-emerald-400',
    explorer: 'from-orange-100 to-amber-100 border-orange-400',
  };

  return (
    <div id={`avatar-display-${character.nickname}`} className="flex flex-col items-center select-none">
      {/* Avatar Circle Frame */}
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br ${bgGradients[character.job]} border-2 shadow-md transition-transform hover:scale-105 ${sizeClasses[size]}`}
      >
        {/* Hat / Crown on top */}
        {hatItem && (
          <div className="absolute -top-3 text-lg sm:text-xl drop-shadow animate-bounce">
            {hatItem.icon}
          </div>
        )}

        {/* Base Character Emoji/Graphic */}
        <div className="flex items-center justify-center">
          {character.job === 'warrior' && '🛡️⚔️'}
          {character.job === 'wizard' && '🪄✨'}
          {character.job === 'healer' && '💖🌿'}
          {character.job === 'explorer' && '🏹🧭'}
        </div>

        {/* Weapon on side */}
        {weaponItem && (
          <div className="absolute -bottom-1 -right-2 text-base sm:text-xl filter drop-shadow-md">
            {weaponItem.icon}
          </div>
        )}

        {/* Shield / Accessory on other side */}
        {shieldItem && (
          <div className="absolute -bottom-1 -left-2 text-base sm:text-xl filter drop-shadow-md">
            {shieldItem.icon}
          </div>
        )}

        {/* Pet hovering nearby */}
        {petItem && (
          <div className="absolute -top-2 -right-3 text-lg animate-pulse" title={`펫: ${petItem.name}`}>
            {petItem.icon}
          </div>
        )}
      </div>

      {/* Optional Details (Nickname, Level, Job, Title) */}
      {showDetails && (
        <div className="mt-2 text-center">
          {character.equipment.title && (
            <span className="inline-block px-2 py-0.5 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full mb-1">
              {character.equipment.title}
            </span>
          )}
          <div className="text-sm font-bold text-slate-800 flex items-center justify-center gap-1">
            <span>{character.nickname}</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-extrabold bg-sky-100 text-sky-700">
              Lv.{character.level}
            </span>
          </div>
          <div className="text-xs font-medium text-slate-500 flex items-center justify-center gap-1 mt-0.5">
            <span>{jobInfo.icon}</span>
            <span>{jobInfo.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};
