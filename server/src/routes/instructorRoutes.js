const express = require("express");
const router = express.Router();
const instructorController = require("../controllers/instructorController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/debates", authMiddleware, instructorController.createDebate);

router.put("/debates/:id", authMiddleware, instructorController.updateDebate);

router.delete("/debates/:id", authMiddleware, instructorController.deleteDebate);

router.patch("/debates/:id/assign", authMiddleware, instructorController.assignStudentToSide);

router.get("/debates/:id/analytics", authMiddleware, instructorController.getDebateAnalytics);

module.exports = router;