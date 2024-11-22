const { isEmpty, isURL } = require('validator');

const validPlatforms = ['ethereum', 'polygon', 'bsc', 'fuji'];

const validateProjectUpdateInputs = (req, res, next) => {
  const { projectTitle, description, mainLink, world, platform, icon } = req.body;

  // Validar solo los campos presentes en la solicitud

  // Validar que si `projectTitle` está presente, sea válido
  if (projectTitle !== undefined) {
    if (isEmpty(projectTitle)) {
      return res.status(400).json({
        success: false,
        message: 'El título del proyecto no puede estar vacío',
      });
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(projectTitle)) {
      return res.status(400).json({
        success: false,
        message: 'El título del proyecto solo debe contener letras, números y espacios',
      });
    }
  }

  // Validar que si `description` está presente, no esté vacía
  if (description !== undefined && isEmpty(description)) {
    return res.status(400).json({
      success: false,
      message: 'La descripción no puede estar vacía',
    });
  }

  // Validar que si `mainLink` está presente, sea una URL válida
  if (mainLink !== undefined) {
    if (isEmpty(mainLink)) {
      return res.status(400).json({
        success: false,
        message: 'El enlace principal no puede estar vacío',
      });
    }
    if (!isURL(mainLink)) {
      return res.status(400).json({
        success: false,
        message: 'El enlace principal no es válido',
      });
    }
  }

  // Validar que si `icon` está presente, sea una URL válida
  if (icon !== undefined) {
    if (isEmpty(icon)) {
      return res.status(400).json({
        success: false,
        message: 'El ícono no puede estar vacío',
      });
    }
    if (!isURL(icon)) {
      return res.status(400).json({
        success: false,
        message: 'El ícono no es una URL válida',
      });
    }
  }

  // Validar que si `platform` está presente, sea válida
  if (platform !== undefined && !validPlatforms.includes(platform)) {
    return res.status(400).json({
      success: false,
      message: 'Plataforma no soportada',
    });
  }

  // Validar que si `world` está presente, no esté vacío
  if (world !== undefined && isEmpty(world)) {
    return res.status(400).json({
      success: false,
      message: 'El campo world no puede estar vacío',
    });
  }

  next();
};

module.exports = validateProjectUpdateInputs;
