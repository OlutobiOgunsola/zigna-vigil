const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function bookingsCreate({ businessId, args }) {
  const { data } = await productApi.post(
    `${config.products.zignastay.apiUrl}/bookings`,
    {
      guest_name: args.guestName,
      room_id: args.roomId || null,
      check_in: args.checkIn,
      check_out: args.checkOut,
    },
    { headers: { 'x-hotel-id': businessId } }
  );

  return data;
};
