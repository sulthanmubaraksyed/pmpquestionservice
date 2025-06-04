import type { QAResponseIndividual, RetrieveParams, BaseQuestion } from '../types/index.js';
import { questionsData as inQuestions } from '../questions/in.js';
import { questionsData as plQuestions } from '../questions/pl.js';
import { questionsData as exQuestions } from '../questions/ex.js';
import { questionsData as mcQuestions } from '../questions/mc.js';
import { questionsData as clQuestions } from '../questions/cl.js';

// PMP Question Distribution percentages
const PMP_DISTRIBUTION = {
  INITIATING: 13,    // in.ts
  PLANNING: 24,      // pl.ts
  EXECUTING: 31,     // ex.ts
  MONITORING: 25,    // mc.ts
  CLOSING: 7         // cl.ts
};

// Map process groups to their corresponding files
const PROCESS_GROUP_TO_FILE = {
  'Initiating': 'inQuestions',
  'Planning': 'plQuestions',
  'Executing': 'exQuestions',
  'Monitoring and Controlling': 'mcQuestions',
  'Closing': 'clQuestions'
} as const;

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function transformQuestion(q: BaseQuestion): QAResponseIndividual {
  return {
    id: q.id,
    question_pmp: q.question_pmp,
    options_pmp: q.options_pmp,
    OPTION_A: q.options_pmp.OPTION_A,
    OPTION_B: q.options_pmp.OPTION_B,
    OPTION_C: q.options_pmp.OPTION_C,
    OPTION_D: q.options_pmp.OPTION_D,
    option_a_result: q.analysis.option_a_result,
    option_b_result: q.analysis.option_b_result,
    option_c_result: q.analysis.option_c_result,
    option_d_result: q.analysis.option_d_result,
    process_group: q.analysis.process_group,
    knowledge_area: q.analysis.knowledge_area,
    tool: q.analysis.tool,
    suggested_read: Array.isArray(q.analysis.suggested_read)
      ? q.analysis.suggested_read.join(', ')
      : q.analysis.suggested_read,
    concepts_to_understand: q.analysis.concepts_to_understand,
    is_attempted: false,
    question_type: 'Option',
    selected_option: '',
    analysis: q.analysis,
    is_verified: true,
    did_user_get_it_right: undefined
  };
}

export async function retrieveRecordsFromFile({
  processGroup,
  knowledgeArea,
  count = 100
}: RetrieveParams): Promise<QAResponseIndividual[]> {
  try {
    // Debug log for imports
    console.log("Raw inQuestions:", inQuestions);
    console.log("Raw inQuestions.questions:", inQuestions?.questions);

    // Get all questions from each file
    const allQuestions = {
      inQuestions: inQuestions.questions as BaseQuestion[],
      plQuestions: plQuestions.questions as BaseQuestion[],
      exQuestions: exQuestions.questions as BaseQuestion[],
      mcQuestions: mcQuestions.questions as BaseQuestion[],
      clQuestions: clQuestions.questions as BaseQuestion[]
    };

    // Debug log for allQuestions
    console.log("allQuestions.inQuestions length:", allQuestions.inQuestions?.length);
    console.log("allQuestions.inQuestions first item:", allQuestions.inQuestions?.[0]);

    let selectedQuestions: BaseQuestion[] = [];

    // Helper function to filter questions based on criteria
    const filterQuestions = (questions: BaseQuestion[]) => {
      return questions.filter(q => {
        // Always filter out attempted questions
        if (q.is_attempted) return false;

        // Handle 'all' for processGroup
        const matchesProcessGroup = 
          !processGroup || 
          processGroup === 'all' || 
          q.analysis.process_group === processGroup;

        // Handle 'all' for knowledgeArea
        const matchesKnowledgeArea = 
          !knowledgeArea || 
          knowledgeArea === 'all' || 
          q.analysis.knowledge_area === knowledgeArea;

        return matchesProcessGroup && matchesKnowledgeArea;
      });
    };

    // Case 1: If processGroup is specified (and not 'all'), only look in that specific file
    if (processGroup && processGroup !== 'all' && PROCESS_GROUP_TO_FILE[processGroup as keyof typeof PROCESS_GROUP_TO_FILE]) {
      const fileKey = PROCESS_GROUP_TO_FILE[processGroup as keyof typeof PROCESS_GROUP_TO_FILE];
      const questions = allQuestions[fileKey];
      const filteredQuestions = filterQuestions(questions);
      selectedQuestions = shuffleArray(filteredQuestions).slice(0, count);
    }
    // Case 2: If processGroup is 'all' or not specified, search in all files
    else {
      // If only knowledgeArea is specified (and not 'all'), search in all files
      if (knowledgeArea && knowledgeArea !== 'all') {
        const allFilteredQuestions = Object.values(allQuestions)
          .flatMap(questions => filterQuestions(questions));
        selectedQuestions = shuffleArray(allFilteredQuestions).slice(0, count);
      }
      // Default case - use PMP distribution
      else {
        // Calculate target counts for each process group based on distribution
        const distribution = {
          initiating: Math.floor((PMP_DISTRIBUTION.INITIATING / 100) * count),
          planning: Math.floor((PMP_DISTRIBUTION.PLANNING / 100) * count),
          executing: Math.floor((PMP_DISTRIBUTION.EXECUTING / 100) * count),
          monitoring: Math.floor((PMP_DISTRIBUTION.MONITORING / 100) * count),
          closing: Math.floor((PMP_DISTRIBUTION.CLOSING / 100) * count)
        };

        // Calculate remaining count after distribution
        const totalDistributed = Object.values(distribution).reduce((sum, val) => sum + val, 0);
        const remainingCount = count - totalDistributed;

        // Add remaining count to the largest group to ensure we get exactly 'count' questions
        const largestGroup = Object.entries(distribution).reduce((a, b) => a[1] > b[1] ? a : b)[0];
        distribution[largestGroup as keyof typeof distribution] += remainingCount;

        console.log("Distribution (counts per group):", distribution);
        console.log("Initiating (inQuestions) total:", allQuestions.inQuestions.length);
        const unattemptedInitiating = allQuestions.inQuestions.filter(q => !q.is_attempted);
        console.log("Unattempted Initiating:", unattemptedInitiating.length);

        // First pass: Get questions from each category according to distribution
        for (const [group, questions] of Object.entries(allQuestions)) {
          const filteredQuestions = filterQuestions(questions);
          const targetCount = distribution[group as keyof typeof distribution];
          const shuffledQuestions = shuffleArray(filteredQuestions);
          const selectedFromGroup = shuffledQuestions.slice(0, targetCount);
          selectedQuestions = [...selectedQuestions, ...selectedFromGroup];
        }

        // If we still don't have enough questions, get them from any available category
        if (selectedQuestions.length < count) {
          const allFilteredQuestions = Object.values(allQuestions)
            .flatMap(questions => filterQuestions(questions))
            .filter(q => !selectedQuestions.some(selected => selected.id === q.id));

          const additionalQuestions = shuffleArray(allFilteredQuestions).slice(0, count - selectedQuestions.length);
          selectedQuestions = [...selectedQuestions, ...additionalQuestions];
        }

        const selectedInitiating = selectedQuestions.filter(q => q.analysis.process_group === "Initiating");
        console.log("Selected Initiating (final):", selectedInitiating.length);
      }
    }

    // If we don't have enough questions, log a warning
    if (selectedQuestions.length < count) {
      console.warn(`Warning: Only found ${selectedQuestions.length} questions matching the criteria out of requested ${count}`);
    }

    // If no questions found at all, return empty array
    if (selectedQuestions.length === 0) {
      console.warn('No questions found matching the criteria. Returning empty array.');
      return [];
    }

    // Ensure we return exactly the requested count (or fewer if not enough questions available)
    const finalQuestions = selectedQuestions.slice(0, count);

    // Transform and return the questions
    return finalQuestions.map(transformQuestion);
  } catch (error) {
    console.error('Error retrieving questions:', error);
    return []; // Return empty array instead of throwing error
  }
} 