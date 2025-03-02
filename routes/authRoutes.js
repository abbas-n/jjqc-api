const express = require("express");
const auth = require("../controllers/authController");
const validateToken = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post("/sendVerifyCode", auth.sendVerifyCode);
router.post("/sendCodeForPassForget", auth.sendCodeForPassForget);
router.post("/submitNewPass", auth.submitNewPass);
router.post("/submitChangePass",validateToken, auth.submitChangePass);
router.post("/checkVerifyCode", auth.checkVerifyCode);
router.get("/refreshToken", auth.refreshToken);
router.post("/registerUser", auth.registerUser);
router.post("/login", auth.loginUser);
router.post("/logOut", validateToken, auth.logOut);
router.get("/current", validateToken, auth.currentUser);
router.get("/getUserProfileData", validateToken, auth.getUserProfileData);
router.post("/updatePassword", validateToken, auth.updatePassword);
router.post("/getMenuItems", validateToken, auth.getMenuItems);
router.post("/setPanelLight", validateToken, auth.setPanelLight);
router.post("/setPanelThem", validateToken, auth.setPanelThem);
router.post("/loadJcenterForOstan", auth.loadJcenterForOstan);
router.get("/loadCityOstan", auth.loadCistyOstan);

module.exports = router;