const {Booking} = require('../models')
const crudRepository = require('./crud-repository')

class BookingRepository extends crudRepository{
    constructor(){
        super(Booking)
    }

    async createBooking(data, transaction) {
        const response = await Booking.create(data, {transaction: transaction});
        return response;
    }

    async getBooking(data, transaction) {
        const response = await this.model.findByPk(data, {transaction: transaction});
        if (!response) {
          throw new AppError("Cannot find the resource", StatusCodes.NOT_FOUND);
        }
        return response;
      }

      async updateBooking(id, data, transaction){
        const response  = await this.model.update(data, {
            where: {
                id: id,
            }
        }, {transaction: transaction})
      }
}

module.exports = BookingRepository;