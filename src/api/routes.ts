import express from 'express';
import { retrieveRecordsFromFile } from '../utils/questionService.js';
import { listApiKeys } from '../utils/apiKeyService.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import type { RetrieveParams } from '../types/index.js';

const router = express.Router();

/**
 * @api {get} /api/pmp-questions Get PMP Questions
 * @apiName GetPMPQuestions
 * @apiGroup Questions
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} X-API-Key API key for authentication
 * 
 * @apiQuery {string} [processGroup] Process group to filter by (e.g., 'Initiating', 'Planning', 'all')
 * @apiQuery {string} [knowledgeArea] Knowledge area to filter by (e.g., 'Integration', 'Scope', 'all')
 * @apiQuery {number} [count=100] Number of questions to retrieve
 * 
 * @apiSuccess {Object[]} questions List of PMP questions
 * @apiSuccess {string} questions.id Question ID
 * @apiSuccess {string} questions.question_pmp The question text
 * @apiSuccess {Object} questions.options_pmp Question options
 * @apiSuccess {string} questions.OPTION_A Option A
 * @apiSuccess {string} questions.OPTION_B Option B
 * @apiSuccess {string} questions.OPTION_C Option C
 * @apiSuccess {string} questions.OPTION_D Option D
 * @apiSuccess {string} questions.option_a_result Analysis for Option A
 * @apiSuccess {string} questions.option_b_result Analysis for Option B
 * @apiSuccess {string} questions.option_c_result Analysis for Option C
 * @apiSuccess {string} questions.option_d_result Analysis for Option D
 * @apiSuccess {string} questions.process_group Process group
 * @apiSuccess {string} questions.knowledge_area Knowledge area
 * @apiSuccess {string} questions.suggested_read Suggested reading materials
 * @apiSuccess {string} questions.concepts_to_understand Key concepts to understand
 * 
 * @apiError (401) Unauthorized API key is missing
 * @apiError (403) Forbidden Invalid API key
 */
router.get('/pmp-questions', requireApiKey, async (req, res) => {
  try {
    const params: RetrieveParams = {
      processGroup: req.query.processGroup as string,
      knowledgeArea: req.query.knowledgeArea as string,
      count: req.query.count ? parseInt(req.query.count as string) : undefined
    };

    const questions = await retrieveRecordsFromFile(params);
    res.json({ questions });
  } catch (error) {
    console.error('Error retrieving questions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * @api {get} /api/api-keys List API Keys
 * @apiName ListAPIKeys
 * @apiGroup API Keys
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} X-API-Key API key for authentication
 * 
 * @apiSuccess {Object[]} keys List of API keys (showing only partial keys for security)
 * @apiSuccess {string} keys.name Name/description of the API key
 * @apiSuccess {string} keys.key Partial API key (first 8 characters)
 * @apiSuccess {Date} keys.createdAt When the key was created
 * @apiSuccess {Date} keys.lastUsed When the key was last used
 * 
 * @apiError (401) Unauthorized API key is missing
 * @apiError (403) Forbidden Invalid API key
 */
router.get('/api-keys', requireApiKey, (req, res) => {
  const keys = listApiKeys();
  res.json({ keys });
});

export default router; 