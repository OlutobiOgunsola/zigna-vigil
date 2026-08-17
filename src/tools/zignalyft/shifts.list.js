const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function shiftsList({ businessId, args }) {
  const params = {};
  if (args.shift_type) params.shift_type = args.shift_type;
  if (args.staff_id) params.staff_id = args.staff_id;
  if (args.from) params.from = args.from;
  if (args.to) params.to = args.to;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/shift`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
