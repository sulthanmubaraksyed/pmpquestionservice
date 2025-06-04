import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { QAResponseIndividual } from '../types/index.js';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface QuestionDistribution {
  processGroup: {
    [key: string]: number;
  };
  knowledgeArea: {
    [key: string]: number;
  };
}

/**
 * Analyzes the distribution of questions by process group and knowledge area
 * @param lastServiceOutput Optional array of questions from the last service call
 * @returns Promise<QuestionDistribution> Object containing counts by process group and knowledge area
 */
export async function getCount(lastServiceOutput?: QAResponseIndividual[]): Promise<QuestionDistribution> {
  try {
    let questions: QAResponseIndividual[];

    if (lastServiceOutput) {
      // Use the provided last service output
      questions = lastServiceOutput;
    } else {
      // Read from output.json as fallback
      const filePath = path.join(__dirname, 'output.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      questions = data.questions;
    }

    if (!Array.isArray(questions)) {
      throw new Error('Invalid data format: questions should be an array');
    }

    // Initialize counters
    const distribution: QuestionDistribution = {
      processGroup: {},
      knowledgeArea: {}
    };

    // Count questions by process group and knowledge area
    questions.forEach((question) => {
      // Count by process group
      const processGroup = question.process_group;
      if (processGroup) {
        distribution.processGroup[processGroup] = (distribution.processGroup[processGroup] || 0) + 1;
      }

      // Count by knowledge area
      const knowledgeArea = question.knowledge_area;
      if (knowledgeArea) {
        distribution.knowledgeArea[knowledgeArea] = (distribution.knowledgeArea[knowledgeArea] || 0) + 1;
      }
    });

    // Sort the counts in descending order
    const sortCounts = (obj: { [key: string]: number }) => {
      return Object.fromEntries(
        Object.entries(obj).sort(([, a], [, b]) => b - a)
      );
    };

    return {
      processGroup: sortCounts(distribution.processGroup),
      knowledgeArea: sortCounts(distribution.knowledgeArea)
    };
  } catch (error) {
    console.error('Error analyzing question distribution:', error);
    throw new Error('Failed to analyze question distribution');
  }
}

/**
 * Prints the distribution analysis in a formatted way
 * @param lastServiceOutput Optional array of questions from the last service call
 * @param title Optional title for the analysis output
 */
export async function printDistribution(lastServiceOutput?: QAResponseIndividual[], title: string = 'Question Distribution Analysis'): Promise<void> {
  try {
    const distribution = await getCount(lastServiceOutput);
    
    console.log(`\n${title}:`);
    console.log('\nBy Process Group:');
    console.log('----------------');
    Object.entries(distribution.processGroup).forEach(([group, count]) => {
      console.log(`${group}: ${count} questions`);
    });

    console.log('\nBy Knowledge Area:');
    console.log('------------------');
    Object.entries(distribution.knowledgeArea).forEach(([area, count]) => {
      console.log(`${area}: ${count} questions`);
    });
  } catch (error) {
    console.error('Error printing distribution:', error);
  }
} 