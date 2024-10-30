const express = require("express");
const public = require("../controllers/publicController");
const validateToken = require("../middleware/validateTokenHandler");

const router = express.Router();

router.get("/cities", public.getCities);
router.post("/estimateCost", public.estimateCost);

module.exports = router;