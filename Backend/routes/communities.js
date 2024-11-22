const express = require('express');
const router = express.Router();
const communitiesController = require('../controllers/Communities');

// Rutas para comunidades
router.get('/getAll', communitiesController.getAllCommunities);
router.post('/create', communitiesController.createCommunity);
router.get('/communities/search', communitiesController.searchCommunities);

module.exports = router;
