const express = require('express');

// const { InfoController } = require('../../controllers');

const router = express.Router();

// router.get('/info', InfoController.info);
const bookingRoutes = require("./booking-routes");
router.use("/bookings", bookingRoutes);

module.exports = router;