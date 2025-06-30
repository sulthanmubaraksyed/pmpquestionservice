import express, { Request, Response, RequestHandler } from 'express';
import { retrieveRecordsFromFile, saveRecordToFile, getQuestion, deleteQuestion } from '../utils/questionService.js';
import { listApiKeys } from '../utils/apiKeyService.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { logger } from '../utils/logger.js';
import type { RetrieveParams } from '../types/index.js';

const router = express.Router();

// Request logging middleware
const logRequest = (req: Request, res: Response, next: Function) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    logger.apiRequest(req.method, req.path, res.statusCode, duration, req.ip);
    return originalSend.call(this, data);
  };
  
  next();
};

// Apply request logging to all routes
router.use(logRequest);

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
    console.log('=== ROUTE DEBUG ===');
    console.log('Query parameters received:', req.query);
    console.log('isValid query param:', req.query["isValid"]);
    console.log('isValid type:', typeof req.query["isValid"]);
    
    const params: RetrieveParams = {
      processGroup: req.query["processGroup"] as string,
      knowledgeArea: req.query["knowledgeArea"] as string,
      count: req.query["count"] ? parseInt(req.query["count"] as string) : undefined,
      ...(req.query["isValid"] !== undefined ? { isValid: req.query["isValid"] === 'true' } : {})
    };

    console.log('Params object created:', params);
    console.log('=== END ROUTE DEBUG ===');

    logger.info('PMP Questions API called', { params });
    const questions = await retrieveRecordsFromFile(params);
    res.json({ questions });
  } catch (error) {
    logger.error('Error retrieving questions:', error);
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
  logger.info('API Keys list requested');
  const keys = listApiKeys();
  res.json({ keys });
});

/**
 * @api {post} /api/saveRecord Save or Update a PMP Question Record
 * @apiName SaveRecord
 * @apiGroup Questions
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} X-API-Key API key for authentication
 *
 * @apiBody {QAResponseIndividual} record The record to update (must include id and process_group)
 *
 * @apiSuccess {string} message Success message
 * @apiError (400) BadRequest Invalid input or missing fields
 * @apiError (404) NotFound Record not found
 * @apiError (500) InternalServerError Failed to update record
 */
const saveRecordHandler: RequestHandler = async (req, res) => {
  logger.info('SAVE RECORD API CALL RECEIVED', {
    id: req.body.id,
    processGroup: req.body.process_group,
    knowledgeArea: req.body.knowledge_area,
    isValid: req.body.is_valid,
    isVerified: req.body.is_verified,
    isAttempted: req.body.is_attempted,
    selectedOption: req.body.selected_option,
    didUserGetItRight: req.body.did_user_get_it_right,
    isSample: req.body.is_sample,
    additionalNotes: req.body.analysis?.additional_notes
  });
  
  try {
    const record = req.body;
    if (!record || !record.id || !record.process_group) {
      logger.error('VALIDATION ERROR: Missing id or process_group in request body', { record });
      res.status(400).json({ error: 'Missing id or process_group in request body' });
      return;
    }
    logger.info('Request validation passed');
    
    logger.info('Calling saveRecordToFile service...');
    await saveRecordToFile(record);
    logger.info('saveRecordToFile service completed successfully');
    
    logger.info('Sending success response to client...');
    res.json({ message: 'Record updated successfully' });
    logger.info('Success response sent');
    
  } catch (error: any) {
    logger.error('ERROR OCCURRED DURING SAVE PROCESS:', {
      errorType: error.message,
      recordId: req.body.id,
      processGroup: req.body.process_group
    });
    
    if (error.message === 'Record not found') {
      logger.warn('Sending 404 response for record not found', { recordId: req.body.id });
      res.status(404).json({ error: 'Record not found' });
      return;
    } else if (error.message === 'Invalid process_group') {
      logger.warn('Sending 400 response for invalid process_group', { processGroup: req.body.process_group });
      res.status(400).json({ error: 'Invalid process_group' });
      return;
    } else {
      logger.error('Sending 500 response for internal server error', { error: error.message });
      res.status(500).json({ error: 'Failed to update record' });
      return;
    }
  }
};

router.post('/saveRecord', requireApiKey, saveRecordHandler);

/**
 * @api {get} /api/getQuestion Get Question by ID
 * @apiName GetQuestion
 * @apiGroup Questions
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} X-API-Key API key for authentication
 * 
 * @apiQuery {string} id Question ID to retrieve
 * 
 * @apiSuccess {QAResponseIndividual} question The question object
 * @apiError (400) BadRequest Missing question ID
 * @apiError (404) NotFound Question not found
 * @apiError (401) Unauthorized API key is missing
 * @apiError (403) Forbidden Invalid API key
 */
const getQuestionHandler: RequestHandler = async (req, res) => {
  try {
    const { id } = req.query;
    
    logger.info('Get Question API called', { questionId: id });
    
    if (!id || typeof id !== 'string') {
      logger.warn('Missing or invalid question ID', { id });
      res.status(400).json({ error: 'Missing or invalid question ID' });
      return;
    }

    const question = await getQuestion(id);
    
    if (!question) {
      logger.warn('Question not found', { questionId: id });
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    logger.info('Question found and returned', { questionId: id });
    res.json({ question });
  } catch (error) {
    logger.error('Error getting question:', error);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }
};

router.get('/getQuestion', requireApiKey, getQuestionHandler);

/**
 * @api {delete} /api/deleteQuestion Delete Question by ID and Process Group
 * @apiName DeleteQuestion
 * @apiGroup Questions
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} X-API-Key API key for authentication
 * 
 * @apiQuery {string} id Question ID to delete
 * @apiQuery {string} processGroup Process group of the question
 * 
 * @apiSuccess {string} message Success message
 * @apiError (400) BadRequest Missing question ID or process group
 * @apiError (404) NotFound Question not found
 * @apiError (401) Unauthorized API key is missing
 * @apiError (403) Forbidden Invalid API key
 * @apiError (500) InternalServerError Failed to delete question
 */
const deleteQuestionHandler: RequestHandler = async (req, res) => {
  try {
    const { id, processGroup } = req.query;
    
    logger.info('Delete Question API called', { questionId: id, processGroup });
    
    if (!id || typeof id !== 'string') {
      logger.warn('Missing or invalid question ID', { id });
      res.status(400).json({ error: 'Missing or invalid question ID' });
      return;
    }
    
    if (!processGroup || typeof processGroup !== 'string') {
      logger.warn('Missing or invalid process group', { processGroup });
      res.status(400).json({ error: 'Missing or invalid process group' });
      return;
    }

    await deleteQuestion(id, processGroup);
    
    logger.info('Question deleted successfully', { questionId: id, processGroup });
    res.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    logger.error('Error deleting question:', error);
    
    if (error.message === 'Question not found') {
      res.status(404).json({ error: 'Question not found' });
      return;
    } else if (error.message === 'Invalid process_group') {
      res.status(400).json({ error: 'Invalid process group' });
      return;
    } else {
      res.status(500).json({ error: 'Failed to delete question' });
      return;
    }
  }
};

router.delete('/deleteQuestion', requireApiKey, deleteQuestionHandler);

export default router; 