import { useState } from 'react';
import { QuizQuestion } from '../types/systemDesign';
import { HelpCircle, CheckCircle2, XCircle, RotateCcw, Award } from 'lucide-react';

interface QuizViewProps {
  questions: QuizQuestion[];
}

export const QuizView: React.FC<QuizViewProps> = ({ questions }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submitted[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitQuestion = (questionId: string) => {
    if (selectedAnswers[questionId] !== undefined) {
      setSubmitted((prev) => ({ ...prev, [questionId]: true }));
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setSubmitted({});
  };

  const score = Object.keys(submitted).reduce((acc, qId) => {
    const q = questions.find((item) => item.id === qId);
    if (q && selectedAnswers[qId] === q.correctAnswerIndex) {
      return acc + 1;
    }
    return acc;
  }, 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-teal-400" />
            System Design Knowledge Quiz
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test your understanding of architectural tradeoffs, scalability bottlenecks, and key design patterns.
          </p>
        </div>

        {Object.keys(submitted).length > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xl font-extrabold text-emerald-400">{score}</span>
              <span className="text-slate-400 text-xs font-semibold"> / {questions.length}</span>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Score</p>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
              title="Reset Quiz"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Quiz Questions List */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => {
          const isSelected = selectedAnswers[q.id] !== undefined;
          const isSub = submitted[q.id];
          const isCorrect = isSub && selectedAnswers[q.id] === q.correctAnswerIndex;

          return (
            <div
              key={q.id}
              className={`bg-slate-900 border rounded-xl p-5 space-y-3 transition-all ${
                isSub
                  ? isCorrect
                    ? 'border-emerald-500/40'
                    : 'border-rose-500/40'
                  : 'border-slate-800'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded bg-slate-950 text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-800">
                  {qIndex + 1}
                </span>
                <h3 className="text-sm font-bold text-slate-100">{q.question}</h3>
              </div>

              {/* Options List */}
              <div className="space-y-2 pl-7">
                {q.options.map((opt, optIdx) => {
                  const chosen = selectedAnswers[q.id] === optIdx;
                  let optStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800/80';

                  if (isSub) {
                    if (optIdx === q.correctAnswerIndex) {
                      optStyle = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold';
                    } else if (chosen && !isCorrect) {
                      optStyle = 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold';
                    } else {
                      optStyle = 'bg-slate-950 border-slate-900 text-slate-500 opacity-60';
                    }
                  } else if (chosen) {
                    optStyle = 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold';
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isSub}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${optStyle}`}
                    >
                      <span>{opt}</span>
                      {isSub && optIdx === q.correctAnswerIndex && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      )}
                      {isSub && chosen && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Submit & Explanation Footer */}
              <div className="pl-7 space-y-2 pt-1">
                {!isSub ? (
                  <button
                    disabled={!isSelected}
                    onClick={() => handleSubmitQuestion(q.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    Check Answer
                  </button>
                ) : (
                  <div
                    className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                      isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <p className="font-bold mb-1 flex items-center gap-1">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Correct Answer!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </p>
                    <p className="text-slate-300">{q.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Trophy Card without gradients */}
      {Object.keys(submitted).length === questions.length && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-xl p-6 text-center space-y-3">
          <Award className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Quiz Completed!</h3>
          <p className="text-xs text-slate-300">
            You scored {score} out of {questions.length} questions correctly.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors"
          >
            Retake Quiz
          </button>
        </div>
      )}
    </div>
  );
};
