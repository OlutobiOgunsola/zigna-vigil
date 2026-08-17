const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function membersCreate({ businessId, args }) {
  const { data } = await productApi.post(
    `${config.products.zignalyft.apiUrl}/member`,
    {
      first_name: args.firstName,
      last_name: args.lastName,
      email: args.email,
      phone: args.phone || null,
    },
    { headers: { 'x-gym-id': businessId } }
  );

  return data;
};
