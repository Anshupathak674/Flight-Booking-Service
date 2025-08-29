const {Booking} = require('../models')
const crudRepository = require('./crud-repository')

class BookingRepository extends crudRepository{
    constructor(){
        super(Booking)
    }
}

module.exports = BookingRepository;