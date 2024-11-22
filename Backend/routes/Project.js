const express = require('express');
const router = express.Router();
const {getContractDetails ,createProject, getAllProjects} = require('../controllers/Projects')
const validateProjectInputs = require('../middleware/validateProjectInputs');


// Ruta para obtener la dirección del contrato y el ABI
router.get('/contractDetails', getContractDetails);
// Crear un proyecto 
router.post('/Create', createProject, validateProjectInputs);

// Obtener todos los proyectos
// Obtener todos los proyectos
router.get('/Projects',getAllProjects);




module.exports = router;
