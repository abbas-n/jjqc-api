const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const validateToken = require("../middleware/validateTokenHandler");
router.use(validateToken);


//-------------------------OPENAI---------------------------------
router.get("/getTestQuestion", aiController.generateQuestion);



module.exports = router; 