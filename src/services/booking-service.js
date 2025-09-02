const { StatusCodes } = require("http-status-codes");
const { BookingRepository } = require("../repositories");
const AppError = require("../utils/errors/app-error");
const { ServerConfig } = require('../config');
const axios = require('axios');
const db = require('../models')

const bookingRepository = new BookingRepository();

async function createBooking(data) {
    return new Promise((resolve, reject) => {
      const result = db.sequelize.transaction(async function bookingImplementation(t){
        const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`);
        const flightData = flight.data.data.totalSeats;
        if(data.noOfSeats > flightData){
          reject(new AppError(
            "Required number of seats not available",
            StatusCodes.BAD_REQUEST,
          ));
        }
        resolve(true);
      })
    })
}

async function getBookings() {
  try {
    const bookings = await bookingRepository.getAll();
    return bookings;
  } catch (error) {
    throw new AppError(
      "Cannot fetch data of all the bookings",
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}

async function getBooking(id) {
  try {
    const booking = await bookingRepository.get(id);
    return booking;
  } catch (error) {
    if (error.statuscode === StatusCodes.NOT_FOUND) {
      throw new AppError(
        "The requested booking is not present",
        error.statuscode,
      );
    }
    throw new AppError(
      "Cannot fetch data of the requested booking",
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}

module.exports = {
  createBooking,
  getBookings,
  getBooking,
};
