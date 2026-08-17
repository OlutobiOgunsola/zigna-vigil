const { ForbiddenError } = require('../errors');
const { BUSINESS_ENTITY_ERROR_MESSAGES } = require('../lib/literature/errors.literature');
const { HEADER_TO_PRODUCT } = require('../config/products');
const { ROLE_PERMISSIONS } = require('../config/permissions');

const HEADER_TO_BUSINESS_TYPE = {
  'x-gym-id': 'gym',
  'x-hotel-id': 'hotel',
};

const VALID_ROLES = new Set(Object.keys(ROLE_PERMISSIONS));

module.exports = async function businessEntityMiddleware(req, res, next) {
  try {
    const gymId = req.headers['x-gym-id'];
    const hotelId = req.headers['x-hotel-id'];

    if (!gymId && !hotelId) {
      throw new ForbiddenError(BUSINESS_ENTITY_ERROR_MESSAGES.NO_CONTEXT);
    }

    let product;
    let header;
    if (gymId) {
      header = 'x-gym-id';
      product = HEADER_TO_PRODUCT[header];
      req.activeBusinessId = gymId;
    } else {
      header = 'x-hotel-id';
      product = HEADER_TO_PRODUCT[header];
      req.activeBusinessId = hotelId;
    }

    req.productId = product.id;
    req.productSlug = product.slug;
    req.activeBusinessType = HEADER_TO_BUSINESS_TYPE[header];

    // Role resolution order:
    // 1. super_admin from JWT
    // 2. x-user-role header (product dashboards send this)
    // 3. body.role
    // 4. fallback: owner for gym, hotel_owner for hotel (never bare "user")
    if (req.isSuperAdmin) {
      req.activeRole = 'super_admin';
    } else {
      const claimed = String(
        req.headers['x-user-role'] || req.body?.role || ''
      ).trim().toLowerCase();

      if (claimed && VALID_ROLES.has(claimed)) {
        req.activeRole = claimed;
      } else {
        req.activeRole = req.activeBusinessType === 'hotel' ? 'hotel_owner' : 'owner';
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
