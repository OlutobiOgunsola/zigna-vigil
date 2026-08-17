const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function retentionGoals({ businessId, args }) {
  const params = {};
  if (args.status) params.status = args.status;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/retention/goal`,
    { params, headers: { 'x-gym-id': businessId } }
  );
  return data;
};
