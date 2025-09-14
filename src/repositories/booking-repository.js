const {Booking} = require('../models')
const crudRepository = require('./crud-repository')
const {Enums} = require('../utils/common');
const { where, Op } = require( 'sequelize' );
const {BOOKED, CANCELLED, INITIATED, PENDING} = Enums.BOOKING_STATUS
class BookingRepository extends crudRepository{
    constructor(){
        super(Booking)
    }

    async createBooking(data, transaction) {
        const response = await Booking.create(data, {transaction: transaction});
        return response;
    }

    async getBooking(data, transaction) {
        const response = await Booking.findByPk(data, {transaction: transaction});
        if (!response) {
          throw new AppError("Cannot find the resource", StatusCodes.NOT_FOUND);
        }
        return response;
      }

    async cancelOldBookings(currentTime){
        const response = await Booking.update({status: CANCELLED},{
            where:{
                [Op.and]: [
                    {
                        createdAt: {
                            [Op.lt]: currentTime
                        }
                    },
                    {
                        status:{
                            [Op.ne]: BOOKED
                        }
                    },
                    {
                        status: {
                            [Op.ne]: CANCELLED
                        }
                    }
                ]
            }
        })
        return response
    }

      async updateBooking(id, data, transaction){
        const response  = await Booking.update(data, {
            where: {
                id: id,
            }
        }, {transaction: transaction})
      }
}

module.exports = BookingRepository;