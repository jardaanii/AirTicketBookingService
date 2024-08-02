const axios = require("axios");
const { BookingRepository } = require("../repository/index");
const { StatusCodes } = require("http-status-codes");
const {
  FLIGHT_SERVICE_PATH,
  USER_SERVICE_PATH,
} = require("../config/server-config");
const { ServiceError } = require("../utils/errors");
const { createChannel, publishMessage } = require("../utils/messageQueue");
const { REMINDER_BINDING_KEY } = require("../config/server-config");

class BookingService {
  constructor() {
    this.bookingRepository = new BookingRepository();
  }

  subtractHours(dateString, hours) {
    // Parse the ISO 8601 string to create a Date object
    const date = new Date(dateString);

    // Subtract the specified number of hours
    date.setHours(date.getHours() - hours);

    // Return the new date in ISO 8601 format
    return date.toISOString();
  }

  async createBooking(data) {
    try {
      const flightId = data.flightId;
      const getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
      const response = await axios.get(getFlightRequestURL);
      const flightData = response.data.data;
      let priceOfTheFlight = flightData.price;
      if (flightData.totalSeats < data.noOfSeats) {
        throw new ServiceError(
          "Something went wrong in the booking process",
          "Insufficient seats in the flight"
          // StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      const totalCost = priceOfTheFlight * data.noOfSeats;
      const bookingPayload = { ...data, totalCost };
      const booking = await this.bookingRepository.create(bookingPayload);
      console.log("Booking Payload   ", bookingPayload);
      const updateFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
      await axios.patch(updateFlightRequestURL, {
        totalSeats: flightData.totalSeats - booking.noOfSeats,
      });
      const finalBooking = await this.bookingRepository.update(booking.id, {
        status: "Booked",
      });

      if (!finalBooking) {
        throw new ServiceError(
          "Booking creation failed",
          "Unable to update the booking status"
          // StatusCodes.INTERNAL_SERVER_ERROR
        );
      }

      const getAirportRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/airports/`;

      const res1 = await axios.get(
        getAirportRequestURL + flightData.departureAirportId
      );

      const res2 = await axios.get(
        getAirportRequestURL + flightData.arrivalAirportId
      );
      const airportData = {
        departureAirportName: res1.data.data.name,
        arrivalAirportName: res2.data.data.name,
      };
      const channel = await createChannel();

      const getUserRequestURL = `${USER_SERVICE_PATH}/api/v1/profile/${booking.userId}`;
      const res3 = await axios.get(getUserRequestURL);
      const userEmail = res3.data.data.email;

      const notificationTimee = this.subtractHours(flightData.arrivalTime, 10);

      const payload = {
        data: {
          subject: `Flight number ${flightData.flightNumber} booking confirmed `,
          content: `${data.noOfSeats} seats have been booked on  flight number ${flightData.flightNumber} from airport ${airportData.departureAirportName} to ${airportData.arrivalAirportName} on the ${flightData.departureTime} from the boarding gate number ${flightData.boardingGate}`,
          recepientEmail: userEmail,
          notificationTime: notificationTimee,
        },
        service: "CREATE_TICKET",
      };
      await publishMessage(
        channel,
        REMINDER_BINDING_KEY,
        JSON.stringify(payload)
      );
      return finalBooking;
    } catch (error) {
      if (error.name == "RepositoryError" || error.name == "ValidationError") {
        throw error;
      }
      throw new ServiceError();
    }
  }

  async updateBooking(bookingId) {
    try {
      const booking = await this.bookingRepository.get(bookingId);
      const flightId = booking.flightId;

      const getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
      const response = await axios.get(getFlightRequestURL);

      const flightData = response.data.data;
      const updateFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
      await axios.patch(updateFlightRequestURL, {
        totalSeats: flightData.totalSeats + booking.noOfSeats,
      });
      const cancledBooking = await this.bookingRepository.update(bookingId, {
        status: "Cancelled",
      });

      return cancledBooking;
    } catch (error) {
      if (error.name == "RepositoryError" || error.name == "ValidationError") {
        throw error;
      }
      throw new ServiceError();
    }
  }
}

module.exports = BookingService;
