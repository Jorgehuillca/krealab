const router = require("express").Router();
const { getStats, getStockAlerts } = require("../controllers/dashboardController");
const { authMiddleware } = require("../middlewares/auth");
router.use(authMiddleware);
router.get("/", getStats);
router.get("/alerts", getStockAlerts);
module.exports = router;