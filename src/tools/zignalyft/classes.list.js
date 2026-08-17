const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function classesList({ businessId, args }) {
  const params = {};
  if (args.status) params.status = args.status;
  if (args.scope) params.scope = args.scope;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/class`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
