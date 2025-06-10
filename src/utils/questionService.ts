import type { QAResponseIndividual, RetrieveParams, BaseQuestion } from '../types/index.js';
import { questionsData as inQuestions } from '../questions/in.js';
import { questionsData as plQuestions } from '../questions/pl.js';
import { questionsData as exQuestions } from '../questions/ex.js';
import { questionsData as mcQuestions } from '../questions/mc.js';
import { questionsData as clQuestions } from '../questions/cl.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

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

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    did_user_get_it_right: undefined,
    is_valid: q.is_valid,
    additional_notes: q.analysis.additional_notes
  };
}

export async function retrieveRecordsFromFile({
  processGroup,
  knowledgeArea,
  count = 100,
  isValid
}: RetrieveParams): Promise<QAResponseIndividual[]> {
  try {
    // Debug log for imports
    logger.debug("Raw inQuestions:", inQuestions);
    logger.debug("Raw inQuestions.questions:", inQuestions?.questions);

    // Get all questions from each file
    const allQuestions = {
      inQuestions: inQuestions.questions as BaseQuestion[],
      plQuestions: plQuestions.questions as BaseQuestion[],
      exQuestions: exQuestions.questions as BaseQuestion[],
      mcQuestions: mcQuestions.questions as BaseQuestion[],
      clQuestions: clQuestions.questions as BaseQuestion[]
    };

    // Debug log for allQuestions
    logger.debug("allQuestions.inQuestions length:", allQuestions.inQuestions?.length);
    logger.debug("allQuestions.inQuestions first item:", allQuestions.inQuestions?.[0]);

    let selectedQuestions: BaseQuestion[] = [];

    // Helper function to filter questions based on criteria
    const filterQuestions = (questions: BaseQuestion[]) => {
      return questions.filter(q => {
        // Always filter out attempted questions
        if (q.is_attempted) return false;

        // Filter by is_valid if specified
        if (isValid !== undefined && q.is_valid !== isValid) return false;

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

        logger.debug("Distribution (counts per group):", distribution);
        logger.debug("Initiating (inQuestions) total:", allQuestions.inQuestions.length);
        const unattemptedInitiating = allQuestions.inQuestions.filter(q => !q.is_attempted);
        logger.debug("Unattempted Initiating:", unattemptedInitiating.length);

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
        logger.debug("Selected Initiating (final):", selectedInitiating.length);
      }
    }

    // If we don't have enough questions, log a warning
    if (selectedQuestions.length < count) {
      logger.warn(`Only found ${selectedQuestions.length} questions matching the criteria out of requested ${count}`);
    }

    // If no questions found at all, return empty array
    if (selectedQuestions.length === 0) {
      logger.warn('No questions found matching the criteria. Returning empty array.');
      return [];
    }

    // Ensure we return exactly the requested count (or fewer if not enough questions available)
    const finalQuestions = selectedQuestions.slice(0, count);

    // Transform and return the questions
    const transformedQuestions = finalQuestions.map(transformQuestion);
    // Shuffle the final array to randomize process group order
    const result = shuffleArray(transformedQuestions);
    
    // Log successful retrieval
    logger.questionRetrieval({ processGroup, knowledgeArea, count, isValid }, result.length, true);
    
    return result;
  } catch (error) {
    logger.error('Error retrieving questions:', error);
    logger.questionRetrieval({ processGroup, knowledgeArea, count, isValid }, 0, false, error instanceof Error ? error.message : 'Unknown error');
    return []; // Return empty array instead of throwing error
  }
}

/**
 * Updates specific fields in the analysis section of a question record
 * @param record QAResponseIndividual object with fields to update
 */
export async function saveRecordToFile(record: QAResponseIndividual): Promise<void> {
  logger.info('SAVE RECORD PROCESS STARTED', { recordId: record.id, processGroup: record.process_group });
  
  logger.debug('Received record data:', {
    id: record.id,
    processGroup: record.process_group,
    knowledgeArea: record.knowledge_area,
    isValid: record.is_valid,
    additionalNotes: record.analysis?.additional_notes
  });
  
  // Always print the analysis section values being used for updates
  logger.info('Analysis section values for update:', {
    process_group: record.analysis?.process_group,
    knowledge_area: record.analysis?.knowledge_area,
    additional_notes: record.analysis?.additional_notes,
    is_valid: record.is_valid
  });
  
  // Map process group to file name
  const groupToFile = {
    'Initiating': 'in.ts',
    'Planning': 'pl.ts',
    'Executing': 'ex.ts',
    'Monitoring and Controlling': 'mc.ts',
    'Closing': 'cl.ts',
  } as const;
  
  logger.debug('Determining target file...');
  const fileName = groupToFile[record.process_group as keyof typeof groupToFile];
  if (!fileName) {
    logger.error('Invalid process_group', { processGroup: record.process_group });
    throw new Error('Invalid process_group');
  }
  logger.debug(`Target file determined: ${fileName}`);
  
  const filePath = path.join(__dirname, '../questions', fileName);
  logger.debug(`Full file path: ${filePath}`);
  
  logger.debug('Reading existing file content...');
  // Read the file as text
  let fileContent = await fs.readFile(filePath, 'utf-8');
  logger.debug(`File read successfully. Content length: ${fileContent.length} characters`);
  
  // Extract the questions array from the file
  logger.debug('Parsing questions array from file...');
  const match = fileContent.match(/questionsData\s*=\s*({[\s\S]*?"questions"\s*:\s*)(\[[\s\S]*?\])(\s*})/);
  if (!match) {
    logger.error('Could not parse questions array');
    throw new Error('Could not parse questions array');
  }
  logger.debug('Questions array parsed successfully');
  
  const prefix = match[1];
  const questionsArrayStr = match[2];
  const suffix = match[3];
  
  logger.debug('Converting questions array to JSON...');
  let questions: any[] = JSON.parse(questionsArrayStr);
  logger.debug(`JSON parsed successfully. Found ${questions.length} questions in file`);

  // Find the record by id
  logger.debug('Searching for record to update...');
  const idx = questions.findIndex(q => q.id === record.id);
  if (idx === -1) {
    logger.error(`Record with ID ${record.id} not found`);
    throw new Error('Record not found');
  }
  logger.debug(`Record found at index ${idx}`);
  
  logger.debug('Current values in file before update:', {
    before: {
      is_valid: questions[idx].is_valid,
      process_group: questions[idx].analysis?.process_group,
      knowledge_area: questions[idx].analysis?.knowledge_area,
      additional_notes: questions[idx].analysis?.additional_notes
    }
  });
  
  // Always update using values from record (is_valid is at root level)
  if (questions[idx].hasOwnProperty('is_valid') && record.is_valid !== undefined) {
    questions[idx].is_valid = record.is_valid;
  }
  
  // Update analysis section fields using values from record.analysis
  if (questions[idx].analysis) {
    if (record.analysis?.process_group !== undefined) {
      questions[idx].analysis.process_group = record.analysis.process_group;
    }
    if (record.analysis?.knowledge_area !== undefined) {
      questions[idx].analysis.knowledge_area = record.analysis.knowledge_area;
    }
    // Always update additional_notes from analysis section
    questions[idx].analysis.additional_notes = record.analysis?.additional_notes;
  }
  
  logger.debug('Values in file after update:', {
    after: {
      is_valid: questions[idx].is_valid,
      process_group: questions[idx].analysis?.process_group,
      knowledge_area: questions[idx].analysis?.knowledge_area,
      additional_notes: questions[idx].analysis?.additional_notes
    }
  });

  // Re-stringify the questions array (pretty print)
  logger.debug('Converting updated questions back to JSON...');
  const newQuestionsStr = JSON.stringify(questions, null, 2);
  logger.debug(`JSON stringified successfully. New content length: ${newQuestionsStr.length} characters`);
  
  // Rebuild the file content
  logger.debug('Rebuilding file content...');
  const newFileContent = `export const questionsData = ${prefix}${newQuestionsStr}${suffix};\n`;
  logger.debug(`File content rebuilt. Total length: ${newFileContent.length} characters`);
  
  // Write back to the file
  logger.debug('Writing updated content to file...');
  await fs.writeFile(filePath, newFileContent, 'utf-8');
  logger.info('File written successfully!');
  
  logger.saveRecord(record.id, record.process_group, true);
  logger.info('SAVE RECORD PROCESS COMPLETED SUCCESSFULLY');
}

/**
 * Gets a specific question by ID from all process group files
 * @param id The question ID to search for
 * @returns QAResponseIndividual object if found, null otherwise
 */
export async function getQuestion(id: string): Promise<QAResponseIndividual | null> {
  try {
    logger.debug(`Getting question by ID: ${id}`);
    
    // Map process group to file name
    const groupToFile = {
      'Initiating': 'in.ts',
      'Planning': 'pl.ts',
      'Executing': 'ex.ts',
      'Monitoring and Controlling': 'mc.ts',
      'Closing': 'cl.ts',
    } as const;
    
    // Search in all files in parallel
    const searchPromises = Object.entries(groupToFile).map(async ([processGroup, fileName]) => {
      try {
        const filePath = path.join(__dirname, '../questions', fileName);
        logger.debug(`Reading file: ${fileName}`);
        
        // Read the file as text
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // Extract the questions array from the file
        const match = fileContent.match(/questionsData\s*=\s*({[\s\S]*?"questions"\s*:\s*)(\[[\s\S]*?\])(\s*})/);
        if (!match) {
          logger.warn(`Could not parse questions array from ${fileName}`);
          return null;
        }
        
        const questionsArrayStr = match[2];
        const questions: BaseQuestion[] = JSON.parse(questionsArrayStr);
        
        // Find the question by ID
        const found = questions.find(q => q.id === id);
        if (found) {
          logger.debug(`Question found in ${fileName}`);
          return transformQuestion(found);
        }
        
        return null;
      } catch (error) {
        logger.warn(`Error reading file ${fileName}:`, error);
        return null;
      }
    });

    const results = await Promise.all(searchPromises);
    
    // Return the first found result (there should only be one match)
    const foundQuestion = results.find(result => result !== null);
    
    if (foundQuestion) {
      logger.info(`Question found: ${id}`);
    } else {
      logger.warn(`Question not found: ${id}`);
    }
    
    return foundQuestion || null;
  } catch (error) {
    logger.error('Error getting question:', error);
    return null;
  }
} 