const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const User = require("../models/User");
const Debate = require("../models/Debate");

router.use(authMiddleware, adminMiddleware);

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}).select("-password -passwordHash");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
});

router.get("/users/:id/profile", adminController.getUserProfile);
router.patch("/users/:id/userid", adminController.setUserID);
router.patch("/users/:id/reset-id", adminController.resetID);
router.delete("/users/:id/messages", adminController.deleteUserMessages);

router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
});

router.get("/debates", async (req, res) => {
  try {
    const debates = await Debate.find({});
    res.json(debates);
  } catch (err) {
    res.status(500).json({ message: "Error fetching debates", error: err.message });
  }
});

router.get("/debates/:joincode/details", adminController.getDebateDetails);
router.get("/debates/:joincode/messages", adminController.getDebateMessages);
router.delete("/debates/:joincode", adminController.deleteDebate);

router.post("/generate-student-ids", adminController.generateStudentIDs);
router.post("/generate-instructor-ids", adminController.generateInstructorIDs);

module.exports = router;
