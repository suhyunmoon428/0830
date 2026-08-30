import React, { useState } from 'react';
import { DataService } from '../../services/dataService';
import { StudentData } from '../../types';
import { Shield, Sparkles, LogIn, GraduationCap, KeyRound, User } from 'lucide-react';

interface StudentLoginViewProps {
  onLoginSuccess: (student: StudentData) => void;
  onOpenTeacherLogin: () => void;
}

export const StudentLoginView: React.FC<StudentLoginViewProps> = ({
  onLoginSuccess,
  onOpenTeacherLogin,
}) => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Get available starter students for quick demo access
  const allStudents = DataService.getAllStudents();
  const demoList = allStudents.slice(0, 3);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const targetId = studentId.trim();
    if (!targetId) {
      setErrorMsg('학생 아이디를 입력해 주세요. (예: 3-3-01)');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('비밀번호를 입력해 주세요. (기본: 1234)');
      return;
    }

    const student = DataService.getStudentData(targetId);
    if (!student) {
      setErrorMsg('등록되지 않은 학생 아이디입니다. 아이디를 확인해 주세요.');
      return;
    }

    if (student.account.password !== password.trim()) {
      setErrorMsg('비밀번호가 일치하지 않습니다. (기본: 1234)');
      return;
    }

    DataService.setCurrentStudentId(student.account.id);
    onLoginSuccess(student);
  };

  const handleQuickDemoLogin = (demoStudent: StudentData) => {
    setStudentId(demoStudent.account.id);
    setPassword(demoStudent.account.password);
    DataService.setCurrentStudentId(demoStudent.account.id);
    onLoginSuccess(demoStudent);
  };

  return (
    <div id="student-login-view" className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-sky-100 via-slate-50 to-amber-50">
      {/* Top bar with Teacher Dashboard Entry */}
      <div className="w-full max-w-md flex justify-end mb-4">
        <button
          id="btn-goto-teacher-login"
          onClick={onOpenTeacherLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-sky-700 hover:border-sky-400 font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all active:scale-95"
        >
          <GraduationCap className="w-4 h-4 text-sky-600" />
          <span>교사용 대시보드</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border-4 border-sky-400 overflow-hidden">
        {/* Header Hero Banner */}
        <div className="px-6 py-6 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md mb-2 shadow-inner">
              <Sparkles className="w-8 h-8 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-rpg tracking-wide drop-shadow-md">
              수학 RPG: 곱셈 마스터
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 font-medium">
              초등 3학년 2학기 1단원 곱셈 모험의 세계로!
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-4 h-4 text-sky-600" />
                학생 아이디
              </label>
              <input
                id="input-student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="예: 3-3-01"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-all text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <KeyRound className="w-4 h-4 text-sky-600" />
                비밀번호
              </label>
              <input
                id="input-student-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력 (기본: 1234)"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-all text-base"
              />
            </div>

            {errorMsg && (
              <div id="login-error-msg" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold animate-shake">
                {errorMsg}
              </div>
            )}

            <button
              id="btn-student-login-submit"
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-black text-lg rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              <span>모험 시작하기</span>
            </button>
          </form>

          {/* Quick Demo Student Selector */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-2.5 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              체험용 빠른 접속 (1클릭)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {demoList.map((st) => (
                <button
                  key={st.account.id}
                  id={`btn-quick-login-${st.account.id}`}
                  onClick={() => handleQuickDemoLogin(st)}
                  className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-sky-50 border-2 border-slate-200 hover:border-sky-400 rounded-xl text-xs font-bold text-slate-700 hover:text-sky-700 transition-all shadow-2xs group"
                >
                  <span className="text-sm font-extrabold group-hover:scale-110 transition-transform">
                    {st.character.job === 'warrior' ? '⚔️' : st.character.job === 'wizard' ? '🔮' : '🏹'} {st.account.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{st.account.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
