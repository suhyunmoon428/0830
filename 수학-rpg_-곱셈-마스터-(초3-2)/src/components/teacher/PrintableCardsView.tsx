import React from 'react';
import { StudentData } from '../../types';
import { Printer, ArrowLeft, Shield, Sparkles } from 'lucide-react';

interface PrintableCardsViewProps {
  students: StudentData[];
  onBack: () => void;
}

export const PrintableCardsView: React.FC<PrintableCardsViewProps> = ({ students, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="printable-cards-view" className="min-h-screen bg-slate-100/70 p-4 sm:p-6 print:p-0 print:bg-white font-sans">
      {/* Non-Printable Header Bar */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-5 rounded-[24px] shadow-xs border border-slate-200/80 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-from-print"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              학생 계정 안내 카드 인쇄 미리보기
            </h2>
            <p className="text-xs text-slate-500">
              A4 용지에 2열 배치되어 가위로 잘라 학생들에게 배부하기 좋습니다.
            </p>
          </div>
        </div>

        <button
          id="btn-trigger-print"
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs shadow-xs transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>인쇄하기 (Print)</span>
        </button>
      </div>

      {/* Printable Cards Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4 print:w-full">
        {students.map((student) => (
          <div
            key={student.account.id}
            className="bg-white rounded-[22px] border border-dashed border-slate-300 p-6 shadow-2xs flex flex-col justify-between break-inside-avoid print:border-slate-800 print:shadow-none min-h-[220px]"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                  <span className="text-sm font-bold text-slate-900">
                    수학 RPG: 곱셈 마스터
                  </span>
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">3학년 2학기 1단원</span>
              </div>

              {/* Student Credentials */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-500">학생 이름 (번호)</span>
                  <span className="text-sm font-bold text-slate-900">
                    {student.account.name} ({student.account.number}번)
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-500">로그인 아이디</span>
                  <span className="text-sm font-bold font-mono text-indigo-600">
                    {student.account.id}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="font-semibold text-slate-500">초기 비밀번호</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {student.account.password}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer / Notes */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="font-medium">직업: {student.character.job}</span>
              <span>선생님 확인용 계정 카드 ✂️</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
