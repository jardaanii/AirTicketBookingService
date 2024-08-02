const { StatusCodes } = require("http-status-codes");
const { BookingService } = require("../services/index");
const bookingService = new BookingService();
class BookingController {
  sendMessageToQueue = async (req, res) => {
    try {
      const payload = {
        data: {
          subject: "This is a notification from queue",
          content: "Some queue will subscribe this",
          recepientEmail: "kiraacodes@gmail.com",
          notificationTime: "2024-07-25T06:41:20",
        },
        service: "CREATE_TICKET",
      };
      await publishMessage(
        channel,
        REMINDER_BINDING_KEY,
        JSON.stringify(payload)
      );
      return res.status(StatusCodes.OK).json({
        message: "Successfully published the message",
        success: true,
        err: {},
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Failed to publish the message",
        success: false,
        err: error.message,
      });
    }
  };

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
      console.error("Error in booking creation:", error);
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
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
      return res
        .status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          message: error.message,
          success: false,
          err: error.explaination,
          data: {},
        });
    }
  }
}

module.exports = BookingController;
