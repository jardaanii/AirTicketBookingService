const { StatusCodes } = require("http-status-codes");
const { BookingService } = require("../services/index");
const { createChannel, publishMessage } = require("../utils/messageQueue");
const { REMINDER_BINDING_KEY } = require("../config/server-config");

const bookingService = new BookingService();

class BookingController {
  constructor() {
    // this.channel = channel;
  }

  async sendMessageToQueue(req, res) {
    const channel = await createChannel();
    const data = { message: "Success" };
    publishMessage(channel, REMINDER_BINDING_KEY, JSON.stringify(data));
    return res.status(StatusCodes.OK).json({
      message: "Successfully published the message",
      success: true,
      err: {},
    });
  }

  async create(req, res) {
    try {
      const response = await bookingService.createBooking(req.body);
      return res.status(StatusCodes.OK).json({
        message: "Successfully completed the booking",
        success: true,
        err: {},
        data: response,
      });
    } catch (error) {
      return res.status(error.statusCode).json({
        message: error.message,
        success: false,
        err: error.explaination,
        data: {},
      });
    }
  }

  async update(req, res) {
    try {
      const response = await bookingService.updateBooking(req.params.id);
      return res.status(StatusCodes.OK).json({
        message: "Successfully updated the booking",
        success: true,
        err: {},
        data: response,
      });
    } catch (error) {
      return res.status(error.statusCode).json({
        message: error.message,
        success: false,
        err: error.explaination,
        data: {},
      });
    }
  }
}

module.exports = BookingController;
