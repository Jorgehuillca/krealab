const router = require("express").Router();
const { getMaterials } = require("../controllers/materialController");
const { authMiddleware } = require("../middlewares/auth");
router.use(authMiddleware);
router.get("/", getMaterials);
module.exports = router;