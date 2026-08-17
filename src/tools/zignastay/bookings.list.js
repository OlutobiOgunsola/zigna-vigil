const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function bookingsList({ businessId, args }) {
  const params = {};
  if (args.status) params.status = args.status;
  if (args.date) params.date = args.date;

  const { data } = await productApi.get(
    `${config.products.zignastay.apiUrl}/bookings`,
    { params, headers: { 'x-hotel-id': businessId } }
  );

  return data;
};
