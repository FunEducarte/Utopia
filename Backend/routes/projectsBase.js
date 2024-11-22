const express = require('express');
const router = express.Router();
const {
    updateProject, 
    isUserJoined,
    joinProject,
    getProjectDetails,
    leaveProject,} = require('../controllers/ProjectBase');
const validateProjectInputs = require('../middleware/validateProjectInputs');


router.post('/join', joinProject);

// Ruta para actualizar un proyecto por ID
router.put('/push/:id', validateProjectInputs,updateProject);

// Obtener proyectos a los que el usuario se ha unido según su dirección y mundo
// Obtener proyectos por dirección de usuario y mundo
router.get('/user', getProjectDetails);

// Ruta para "desunirse" de un proyecto
router.post('/leave', leaveProject);

router.get('/:projectId/is-joined', isUserJoined);

module.exports = router;
