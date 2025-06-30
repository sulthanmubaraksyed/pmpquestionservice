import { API_CONFIG, getApiUrl } from '../config.js';
import type { QAResponseIndividual, RetrieveParams } from '../types/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process group to file mapping
const PROCESS_GROUP_FILES = {
  "Initiating": "in.ts",
  "Planning": "pl.ts", 
  "Executing": "ex.ts",
  "Monitoring and Controlling": "mc.ts",
  "Closing": "cl.ts"
};

// Add electron types
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
    };
  }
}

// Add type declarations for File System Access API
declare global {
  interface Window {
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
  
  interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }
  
  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
  }
  
  interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | BufferSource | Blob): Promise<void>;
    close(): Promise<void>;
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function retrieveRecordsFromFile({ 
  processGroup, 
  knowledgeArea, 
  tool, 
  count = 100,
  isValid // This parameter is ignored - we always filter for is_valid === false
}: RetrieveParams): Promise<QAResponseIndividual[]> {
  try {
    console.log('🚨🚨🚨 UPDATED CODE IS RUNNING - FILTERING FOR is_valid === false 🚨🚨🚨');
    console.log('=== retrieveRecordsFromFile Service Call Started ===');
    console.log('Parameters:', { processGroup, knowledgeArea, tool, count, isValid });
    console.log('🚨🚨🚨 NOTE: isValid parameter is IGNORED - always filtering for is_valid === false 🚨🚨🚨');
    
    let allQuestions: QAResponseIndividual[] = [];
    
    // Determine which files to read based on processGroup
    const filesToRead = processGroup && processGroup !== 'all' 
      ? [PROCESS_GROUP_FILES[processGroup as keyof typeof PROCESS_GROUP_FILES]]
      : Object.values(PROCESS_GROUP_FILES);
    
    console.log('Files to read:', filesToRead);
    
    // Read questions from all relevant files
    for (const fileName of filesToRead) {
      if (!fileName) continue;
      
      try {
        const filePath = path.join(__dirname, '..', 'questions', fileName);
        console.log(`Reading file: ${filePath}`);
        
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // Extract the JSON data from the TypeScript export
        const jsonMatch = fileContent.match(/export const questionsData = ({[\s\S]*});/);
        if (!jsonMatch) {
          console.warn(`Invalid file format in ${fileName}`);
          continue;
        }
        
        const data = JSON.parse(jsonMatch[1]);
        const fileQuestions = data.questions || [];
        
        console.log(`Found ${fileQuestions.length} questions in ${fileName}`);
        allQuestions.push(...fileQuestions);
        
      } catch (fileError) {
        console.error(`Error reading file ${fileName}:`, fileError);
        continue;
      }
    }
    
    console.log(`Total questions loaded: ${allQuestions.length}`);
    
    // Apply filters
    let filteredQuestions = allQuestions;
    
    // Filter by knowledge area
    if (knowledgeArea && knowledgeArea !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => 
        q.analysis?.knowledge_area === knowledgeArea
      );
      console.log(`After knowledge area filter (${knowledgeArea}): ${filteredQuestions.length} questions`);
    }
    
    // Filter by tool
    if (tool && tool !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => 
        q.analysis?.tool === tool
      );
      console.log(`After tool filter (${tool}): ${filteredQuestions.length} questions`);
    }
    
    // ALWAYS filter for is_valid === false (ignoring the isValid parameter)
    filteredQuestions = filteredQuestions.filter(q => q.is_valid === false);
    console.log(`After is_valid === false filter: ${filteredQuestions.length} questions`);
    
    // Limit the number of questions
    if (count && count > 0) {
      filteredQuestions = filteredQuestions.slice(0, count);
      console.log(`After count limit (${count}): ${filteredQuestions.length} questions`);
    }
    
    // Shuffle the questions to avoid ordered results
    const shuffledQuestions = shuffleArray(filteredQuestions);
    
    // Ensure all questions have the is_sample attribute set to "No" by default
    const questionsWithDefaultSample = shuffledQuestions.map(question => ({
      ...question,
      is_sample: question.is_sample || "No"
    }));
    
    console.log(`Final result: ${questionsWithDefaultSample.length} questions`);
    console.log('=== retrieveRecordsFromFile Service Call Completed Successfully ===');
    
    return questionsWithDefaultSample;
  } catch (error) {
    console.error('Error retrieving questions:', error);
    console.log('=== retrieveRecordsFromFile Service Call Failed ===');
    throw error;
  }
}

export async function saveResponseToFile(questionResponse: QAResponseIndividual): Promise<void> {
  console.log('=== saveResponseToFile Service Call Started ===');
  console.log('Question Response to save:', {
    id: questionResponse.id,
    question_pmp: questionResponse.question_pmp?.substring(0, 50) + '...',
    is_valid: questionResponse.is_valid,
    selected_option: questionResponse.selected_option,
    is_attempted: questionResponse.is_attempted,
    did_user_get_it_right: questionResponse.did_user_get_it_right,
    process_group: questionResponse.analysis?.process_group,
    knowledge_area: questionResponse.analysis?.knowledge_area,
    tool: questionResponse.analysis?.tool,
    additional_notes: questionResponse.analysis?.additional_notes
  });
  
  try {
    const url = getApiUrl('/api/saveRecord');
    console.log('API Request Details:');
    console.log('URL:', url);
    console.log('Method:', 'POST');
    console.log('Headers:', {
      'X-API-Key': API_CONFIG.apiKey ? '***' : 'Not Set',
      'Content-Type': 'application/json'
    });
    console.log('Request Body (full):', JSON.stringify(questionResponse, null, 2));
    console.log('Request Body (summary):', {
      id: questionResponse.id,
      question_pmp: questionResponse.question_pmp?.substring(0, 50) + '...',
      selected_option: questionResponse.selected_option,
      is_attempted: questionResponse.is_attempted,
      did_user_get_it_right: questionResponse.did_user_get_it_right,
      additional_notes: questionResponse.analysis?.additional_notes
    });

    console.log('Making fetch request...');
    // Make API request to save the response with API key
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': API_CONFIG.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionResponse),
    });

    console.log('Fetch request completed');
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ Response not OK:', response.status, response.statusText);
      throw new Error(`Failed to save response: ${response.status}`);
    }

    console.log('✅ Response OK, reading response body...');
    const responseText = await response.text();
    console.log('Response Body:', responseText);
    
    console.log('✅ Question updated successfully in backend');
    console.log('=== saveResponseToFile Service Call Completed Successfully ===');
  } catch (error) {
    console.error('❌ Error in saveResponseToFile:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    console.log('=== saveResponseToFile Service Call Failed ===');
    throw error;
  }
}

/**
 * Backend service function to save/update a record in the appropriate process group file
 * @param record The record to save/update
 */
export async function saveRecordToFile(record: QAResponseIndividual): Promise<void> {
  try {
    const { id, process_group } = record;
    
    if (!id || !process_group) {
      throw new Error('Missing id or process_group in record');
    }
    
    const fileName = PROCESS_GROUP_FILES[process_group as keyof typeof PROCESS_GROUP_FILES];
    if (!fileName) {
      throw new Error('Invalid process_group');
    }
    
    const filePath = path.join(__dirname, '..', 'questions', fileName);
    
    // Read the current file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Extract the JSON data from the TypeScript export
    const jsonMatch = fileContent.match(/export const questionsData = ({[\s\S]*});/);
    if (!jsonMatch) {
      throw new Error('Invalid file format');
    }
    
    const data = JSON.parse(jsonMatch[1]);
    
    // Find and update the question
    const questionIndex = data.questions.findIndex((q: any) => q.id === id);
    if (questionIndex === -1) {
      throw new Error('Record not found');
    }
    
    // Update the question with the new data
    data.questions[questionIndex] = {
      ...data.questions[questionIndex],
      ...record,
      // Ensure is_sample has a default value of "No" if not present
      is_sample: record.is_sample || data.questions[questionIndex].is_sample || "No",
      // Ensure analysis field is properly structured
      analysis: {
        ...data.questions[questionIndex].analysis,
        ...record.analysis
      }
    };
    
    // Write the updated content back to file
    const updatedContent = fileContent.replace(
      /export const questionsData = {[\s\S]*};/,
      `export const questionsData = ${JSON.stringify(data, null, 2)};`
    );
    
    await fs.writeFile(filePath, updatedContent, 'utf-8');
    
    console.log(`✅ Record ${id} updated successfully in ${fileName}`);
  } catch (error) {
    console.error('❌ Error in saveRecordToFile:', error);
    throw error;
  }
}

/**
 * Backend service function to get a question by ID from all process group files
 * @param id The question ID to find
 * @returns The question if found, null otherwise
 */
export async function getQuestion(id: string): Promise<QAResponseIndividual | null> {
  try {
    // Search all process group files in parallel
    const searchPromises = Object.values(PROCESS_GROUP_FILES).map(async (fileName) => {
      try {
        const filePath = path.join(__dirname, '..', 'questions', fileName);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // Extract the JSON data from the TypeScript export
        const jsonMatch = fileContent.match(/export const questionsData = ({[\s\S]*});/);
        if (!jsonMatch) {
          return null;
        }
        
        const data = JSON.parse(jsonMatch[1]);
        const question = data.questions.find((q: any) => q.id === id);
        
        return question || null;
      } catch (error) {
        console.error(`Error reading file ${fileName}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(searchPromises);
    const foundQuestion = results.find(result => result !== null);
    
    // Ensure the found question has the is_sample attribute set to "No" by default
    if (foundQuestion) {
      return {
        ...foundQuestion,
        is_sample: foundQuestion.is_sample || "No"
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error in getQuestion:', error);
    throw error;
  }
}

/**
 * Backend service function to delete a question from the appropriate process group file
 * @param questionId The ID of the question to delete
 * @param processGroup The process group of the question
 * @returns Promise<void>
 */
export async function deleteQuestion(questionId: string, processGroup: string): Promise<void> {
  try {
    if (!questionId || !processGroup) {
      throw new Error('Missing questionId or processGroup');
    }
    
    const fileName = PROCESS_GROUP_FILES[processGroup as keyof typeof PROCESS_GROUP_FILES];
    if (!fileName) {
      throw new Error('Invalid process_group');
    }
    
    const filePath = path.join(__dirname, '..', 'questions', fileName);
    
    // Read the current file content
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Extract the JSON data from the TypeScript export
    const jsonMatch = fileContent.match(/export const questionsData = ({[\s\S]*});/);
    if (!jsonMatch) {
      throw new Error('Invalid file format');
    }
    
    const data = JSON.parse(jsonMatch[1]);
    
    // Find the question index
    const questionIndex = data.questions.findIndex((q: any) => q.id === questionId);
    if (questionIndex === -1) {
      throw new Error('Question not found');
    }
    
    // Remove the question from the array
    data.questions.splice(questionIndex, 1);
    
    // Write the updated content back to file
    const updatedContent = fileContent.replace(
      /export const questionsData = {[\s\S]*};/,
      `export const questionsData = ${JSON.stringify(data, null, 2)};`
    );
    
    await fs.writeFile(filePath, updatedContent, 'utf-8');
    
    console.log(`✅ Question ${questionId} deleted successfully from ${fileName}`);
  } catch (error) {
    console.error('❌ Error in deleteQuestion:', error);
    throw error;
  }
}

// Export the interface
export type { QAResponseIndividual }; 