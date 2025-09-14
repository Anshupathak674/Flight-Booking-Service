const { StatusCodes } = require("http-status-codes");
const { BookingRepository } = require("../repositories");
const AppError = require("../utils/errors/app-error");
const { ServerConfig } = require('../config');
const axios = require('axios');
const db = require('../models')
const {Enums} = require('../utils/common');
const {BOOKED, CANCELLED, INITIATED, PENDING} = Enums.BOOKING_STATUS
const { Op } = require("sequelize");


const bookingRepository = new BookingRepository();

async function createBooking(data) {
    // return new Promise((resolve, reject) => {
    //   const result = db.sequelize.transaction(async function bookingImplementation(t){
    //     const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`);
    //     const flightData = flight.data.data.totalSeats;
    //     if(data.noOfSeats > flightData){
    //       reject(new AppError(
    //         "Required number of seats not available",
    //         StatusCodes.BAD_REQUEST,
    //       ));
    //     }
    //     resolve(true);
    //   })
    // })
    const transaction = await db.sequelize.transaction();
    try {
      const flight = await axios.get(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}`);
      const flightData = flight.data.data;
      if(data.noOfSeats > flightData.totalSeats){
        throw(new AppError(
          "Required number of seats not available",
          StatusCodes.BAD_REQUEST,
        ));
      }

      const totalBillingAmount = data.noOfSeats * flightData.price;
      const bookingPayload = {...data, totalCost: totalBillingAmount};

      const booking = await bookingRepository.createBooking(bookingPayload, transaction);

      await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${data.flightId}/seats`, {
        seats: data.noOfSeats
      })
      await transaction.commit();
      return booking;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
}


async function makePayment(data) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.getBooking(data.bookingID, transaction);
    if(bookingDetails.dataValues.status == CANCELLED){
      throw(new AppError(
        "The booking is cancelled",
        StatusCodes.BAD_REQUEST,
      ));
    }
    const bookingTime = bookingDetails.dataValues.createdAt;
    const currentTime = new Date();
    if(currentTime - bookingTime >= 60000){
      await cancelBooking(data.bookingID);
      throw(new AppError(
        "Transaction timed out",
        StatusCodes.BAD_REQUEST,
      ));
    }
    if(bookingDetails.totalCost != data.totalCost){
      throw(new AppError(
        "Insufficient Amount",
        StatusCodes.BAD_REQUEST,
      ));
    }

    if(bookingDetails.userId != data.userId){
      throw(new AppError(
        "User doesn't match",
        StatusCodes.BAD_REQUEST,
      ));
    }

    const updatedBooking = await bookingRepository.updateBooking(data.bookingID, {status: BOOKED}, transaction);
    await transaction.commit();
    return updatedBooking;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function cancelBooking(bookingID) {
  const transaction = await db.sequelize.transaction();
  try {
    const bookingDetails = await bookingRepository.getBooking(bookingID, transaction);
    console.log(bookingDetails)
    if(bookingDetails.dataValues.status == CANCELLED){
      await transaction.commit();
      return true;
    }
    await axios.patch(`${ServerConfig.FLIGHT_SERVICE}/api/v1/flights/${bookingDetails.dataValues.flightId}/seats`, {
      seats: bookingDetails.dataValues.noOfSeats,
      decrease: 0
    })
    await bookingRepository.updateBooking(bookingID, {status: CANCELLED}, transaction);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function cancelOldBookings(){
  try {
    const currentTime = new Date( Date.now() - 1000 * 300 ); // time 5 mins ago;
    const response = await bookingRepository.cancelOldBookings(currentTime);
    return response
  } catch (error) {
    console.log(error)
  }
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
  makePayment,
  cancelOldBookings
};
