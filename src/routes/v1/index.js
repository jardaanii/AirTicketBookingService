const express = require("express");
const { BookingController } = require("../../controllers/index");

const router = express.Router();
const bookingController = new BookingController();

router.post("/bookings", bookingController.create);
router.patch("/bookings/:id", bookingController.update);
router.post("/publish", bookingController.sendMessageToQueue);

module.exports = router;
