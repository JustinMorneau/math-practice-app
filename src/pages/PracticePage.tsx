import { useState } from 'react';
import { useLocation } from 'react-router';
import { ROUTES } from '../app/routes';
import { Button, ButtonLink } from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import PageContainer from '../components/layout/PageContainer';
import QuestionCard from '../components/practice/QuestionCard';
import { generateQuestionForOperations } from '../services/questionGenerator';
import type { PracticeConfig } from '../types';
import { formatDifficulty, formatOperationList } from '../utils/format';
import { isPracticeConfig } from '../utils/validation';
import styles from './PracticePage.module.css';

/**
 * Shows practice cards for the setup chosen on the practice setup page, and
 * sends the student back to setup when no valid setup was passed (for
 * example, after typing the URL directly).
 */
function PracticePage() {
  const { state } = useLocation();

  if (!isPracticeConfig(state)) {
    return (
      <PageContainer title="Practice">
        <EmptyState
          message="Let's set up your practice first."
          action={<ButtonLink to={ROUTES.practiceSetup}>Set Up Practice</ButtonLink>}
        />
      </PageContainer>
    );
  }

  return <PracticeRound config={state} />;
}

/**
 * A simple run of cards: answer, flip, report, next card. Phase 7 replaces
 * this with a full practice session that records every attempt.
 */
function PracticeRound({ config }: { config: PracticeConfig }) {
  const createNextQuestion = () =>
    generateQuestionForOperations(config.operations, config.difficulty);

  const [question, setQuestion] = useState(createNextQuestion);
  const [questionNumber, setQuestionNumber] = useState(1);

  const totalQuestions = config.sessionLength === 'continuous' ? null : config.sessionLength;
  const isFinished = totalQuestions !== null && questionNumber > totalQuestions;

  function handleResult() {
    setQuestionNumber((current) => current + 1);
    setQuestion(createNextQuestion());
  }

  function handlePracticeAgain() {
    setQuestionNumber(1);
    setQuestion(createNextQuestion());
  }

  return (
    <PageContainer title="Practice" showTitle={false}>
      <h1 className="visually-hidden">Practice</h1>
      <p className={styles.details}>
        {formatOperationList(config.operations)}, {formatDifficulty(config.difficulty)} level
      </p>

      {isFinished ? (
        <EmptyState
          message={`Nice work! You finished all ${totalQuestions} questions.`}
          action={<Button onClick={handlePracticeAgain}>Practice Again</Button>}
        />
      ) : (
        <QuestionCard
          key={question.id}
          question={question}
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
          onResult={handleResult}
          focusOnMount={questionNumber > 1}
        />
      )}

      <div className={styles.footer}>
        <ButtonLink to={ROUTES.practiceSetup} variant="secondary">
          Change Setup
        </ButtonLink>
      </div>
    </PageContainer>
  );
}

export default PracticePage;
