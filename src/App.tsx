/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DataService } from './services/dataService';
import { StudentData } from './types';
import { StudentLoginView } from './components/student/StudentLoginView';
import { CharacterCreationModal } from './components/student/CharacterCreationModal';
import { WorldMapView } from './components/student/WorldMapView';
import { LearningStageView } from './components/student/LearningStageView';
import { ShopView } from './components/student/ShopView';
import { MonsterBookView } from './components/student/MonsterBookView';
import { CharacterProfileView } from './components/student/CharacterProfileView';
import { TeacherLoginModal } from './components/teacher/TeacherLoginModal';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';

type AppView =
  | 'student_login'
  | 'world_map'
  | 'learning_stage'
  | 'shop'
  | 'monster_book'
  | 'character_profile'
  | 'teacher_dashboard';

export default function App() {
  const [view, setView] = useState<AppView>('student_login');
  const [currentStudent, setCurrentStudent] = useState<StudentData | null>(null);
  const [activeStageId, setActiveStageId] = useState<number>(1);
  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState<boolean>(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState<boolean>(false);

  // Initialize session on load
  useEffect(() => {
    const savedId = DataService.getCurrentStudentId();
    if (savedId) {
      const student = DataService.getStudentData(savedId);
      if (student) {
        setCurrentStudent(student);
        setView('world_map');
      }
    }
  }, []);

  const handleStudentLoginSuccess = (student: StudentData) => {
    setCurrentStudent(student);
    // If student has level 1 and default name, prompt character customization
    if (student.character.level === 1 && (!student.character.nickname || student.character.nickname === '모험가')) {
      setShowCharacterCreation(true);
    }
    setView('world_map');
  };

  const handleStudentLogout = () => {
    DataService.setCurrentStudentId(null);
    setCurrentStudent(null);
    setView('student_login');
  };

  const handleOpenTeacherDashboard = () => {
    setView('teacher_dashboard');
  };

  const handleTeacherLogout = () => {
    setView('student_login');
  };

  const handleStudentUpdated = (updated: StudentData) => {
    setCurrentStudent(updated);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-sky-500 selection:text-white">
      {/* 1. Student Login Screen */}
      {view === 'student_login' && (
        <StudentLoginView
          onLoginSuccess={handleStudentLoginSuccess}
          onOpenTeacherLogin={() => setIsTeacherLoginOpen(true)}
        />
      )}

      {/* 2. World Map Screen */}
      {view === 'world_map' && currentStudent && (
        <WorldMapView
          student={currentStudent}
          onSelectStage={(stageId) => {
            setActiveStageId(stageId);
            setView('learning_stage');
          }}
          onOpenShop={() => setView('shop')}
          onOpenMonsterBook={() => setView('monster_book')}
          onOpenProfile={() => setView('character_profile')}
          onLogout={handleStudentLogout}
        />
      )}

      {/* 3. Learning Stage Solver Screen */}
      {view === 'learning_stage' && currentStudent && (
        <LearningStageView
          student={currentStudent}
          stageId={activeStageId}
          onBackToMap={() => setView('world_map')}
          onStudentUpdated={handleStudentUpdated}
        />
      )}

      {/* 4. Shop Screen */}
      {view === 'shop' && currentStudent && (
        <ShopView
          student={currentStudent}
          onBack={() => setView('world_map')}
          onStudentUpdated={handleStudentUpdated}
        />
      )}

      {/* 5. Monster Book (도감) Screen */}
      {view === 'monster_book' && currentStudent && (
        <MonsterBookView
          student={currentStudent}
          onBack={() => setView('world_map')}
        />
      )}

      {/* 6. Character Profile Screen */}
      {view === 'character_profile' && currentStudent && (
        <CharacterProfileView
          student={currentStudent}
          onBack={() => setView('world_map')}
          onOpenCustomizer={() => setShowCharacterCreation(true)}
          onStudentUpdated={handleStudentUpdated}
        />
      )}

      {/* 7. Teacher Dashboard Portal */}
      {view === 'teacher_dashboard' && (
        <TeacherDashboard onLogout={handleTeacherLogout} />
      )}

      {/* Character Creation / Customizer Modal */}
      {showCharacterCreation && currentStudent && (
        <CharacterCreationModal
          student={currentStudent}
          onComplete={(updated) => {
            setCurrentStudent(updated);
            setShowCharacterCreation(false);
          }}
        />
      )}

      {/* Teacher Authentication Modal */}
      <TeacherLoginModal
        isOpen={isTeacherLoginOpen}
        onClose={() => setIsTeacherLoginOpen(false)}
        onLoginSuccess={handleOpenTeacherDashboard}
      />
    </div>
  );
}
