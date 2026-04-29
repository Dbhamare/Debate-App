const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const debateController = require('../controllers/debateController');
const Debate = require('../models/Debate');
const { validate } = require('../middleware/validate');
const { debateSchemas } = require('../validation/schemas');

function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/public', debateController.getPublicDebates);
router.get('/public/:joincode', debateController.getPublicDebateByJoincode);

router.use(authMiddleware);

router.get('/', debateController.getAllDebates);
router.get('/assigned', debateController.getAssignedDebates);

router.post('/', validate({ body: debateSchemas.createDebateBody }), debateController.createDebate);

router.get('/join/:joincode', validate({ params: debateSchemas.joincodeParams }), debateController.getDebateByJoincode);
router.patch('/join/:joincode/status', validate({ params: debateSchemas.joincodeParams, body: debateSchemas.statusBody }), debateController.updateStatus);
router.patch('/join/:joincode/assign-student', validate({ params: debateSchemas.joincodeParams, body: debateSchemas.assignStudentBody }), debateController.assignStudent);
router.get('/join/:joincode/analytics', validate({ params: debateSchemas.joincodeParams }), debateController.getAnalytics);

router.patch('/join/:joincode/assign-bulk', validate({ params: debateSchemas.joincodeParams, body: debateSchemas.assignBulkBody }), debateController.assignStudentsBulk);
router.delete('/join/:joincode/assign/:userID', validate({ params: debateSchemas.joincodeAndUserParams }), debateController.removeStudentFromDebate);
router.delete('/join/:joincode', validate({ params: debateSchemas.joincodeParams }), debateController.deleteDebateByJoincode);

router.post('/join/:joincode/start', validate({ params: debateSchemas.joincodeParams }), debateController.startDebate);
router.post('/join/:joincode/stop', validate({ params: debateSchemas.joincodeParams }), debateController.stopDebate);
router.get('/join/:joincode/results', validate({ params: debateSchemas.joincodeParams }), debateController.getResults);
router.get('/join/:joincode/votes', validate({ params: debateSchemas.joincodeParams }), debateController.getVotes);
router.post('/join/:joincode/vote', validate({ params: debateSchemas.joincodeParams, body: debateSchemas.voteBody }), debateController.castVote);


router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const regex = new RegExp(escapeRegex(q), 'i');
    const rows = await Debate.find({ title: regex })
      .select('title description joincode isPublic status')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(rows);
  } catch (e) {
    console.error('Debate search error:', e);
    res.status(500).json({ message: 'Failed to search debates' });
  }
});

module.exports = router;
