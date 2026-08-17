const productApi = require('../../lib/http');
const config = require('../../config/environment');

module.exports = async function dashboardRevenue({ businessId, args }) {
  const params = {};
  if (args.from) params.from = args.from;
  if (args.to) params.to = args.to;

  const { data } = await productApi.get(
    `${config.products.zignalyft.apiUrl}/dashboard`,
    { params, headers: { 'x-gym-id': businessId } }
  );

  // Extract revenue-related widgets
  const widgets = data.widgets || {};
  return {
    revenue_this_month: widgets.revenue_this_month || null,
    revenue_expense_trend: widgets.revenue_expense_trend || null,
    expense_breakdown: widgets.expense_breakdown || null,
    membership_breakdown: widgets.membership_breakdown || null,
    pending_renewals: widgets.pending_renewals || null,
  };
};
