const router = require("express").Router();
const { getCategories, createCategory } = require("../controllers/categoryController");
const { authMiddleware } = require("../middlewares/auth");
router.use(authMiddleware);
router.get("/", getCategories);
router.post("/", createCategory);
module.exports = router;