import React, { useState } from 'react';
import { DataService } from '../../services/dataService';
import { GraduationCap, Lock, KeyRound, X } from 'lucide-react';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (DataService.verifyTeacherPassword(password)) {
      onLoginSuccess();
      onClose();
    } else {
      setErrorMsg('비밀번호가 일치하지 않습니다. (기본: 0000)');
    }
  };

  return (
    <div id="teacher-login-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-sm bg-white rounded-[28px] shadow-2xl border border-slate-200/80 overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">교사용 관리 시스템 인증</h3>
          </div>
          <button
            id="btn-close-teacher-login"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>교사용 관리자 비밀번호</span>
            </label>
            <input
              id="input-teacher-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력 (기본: 0000)"
              autoFocus
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white text-base transition-colors"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              취소
            </button>
            <button
              id="btn-teacher-login-submit"
              type="submit"
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-xs active:scale-95 transition-all"
            >
              대시보드 접속
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
