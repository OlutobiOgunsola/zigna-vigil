const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function membersDetail({ businessId, args }) {
  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/member/${args.memberId}`,
    { headers: { 'x-gym-id': businessId } }
  );
  return data;
};
