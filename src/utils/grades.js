export const GRADES = [
  { key: 'not_started', label: 'Not Started', shortLabel: 'Not Started', color: '#6B7280', bgClass: 'bg-gray-100', textClass: 'text-gray-600', borderClass: 'border-l-gray-400' },
  { key: 'learning', label: 'Learning', shortLabel: 'Learning', description: "I'm being shown how to do this", color: '#F59E0B', bgClass: 'bg-amber-50', textClass: 'text-amber-700', borderClass: 'border-l-amber-400' },
  { key: 'practicing', label: 'Practicing', shortLabel: 'Practicing', description: 'I can do this with guidance', color: '#3B82F6', bgClass: 'bg-blue-50', textClass: 'text-blue-700', borderClass: 'border-l-blue-400' },
  { key: 'confident', label: 'Confident', shortLabel: 'Confident', description: 'I can do this independently', color: '#10B981', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700', borderClass: 'border-l-emerald-500' },
  { key: 'mastered', label: 'Mastered', shortLabel: 'Mastered', description: 'I could teach someone else', color: '#8B5CF6', bgClass: 'bg-purple-50', textClass: 'text-purple-700', borderClass: 'border-l-purple-500' },
];

export function getGrade(key) {
  return GRADES.find((g) => g.key === key) || GRADES[0];
}

/**
 * Returns true if the grade counts as "completed" for progress calculations
 * (Confident or Mastered)
 */
export function isCompleted(gradeKey) {
  return gradeKey === 'confident' || gradeKey === 'mastered';
}
