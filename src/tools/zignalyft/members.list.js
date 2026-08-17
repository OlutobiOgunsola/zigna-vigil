const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function membersList({ businessId, args }) {
  const params = {};
  if (args.status) params.status = args.status;
  if (args.search) params.search = args.search;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/member`,
    { params, headers: { 'x-gym-id': businessId } }
  );

  return data;
};
