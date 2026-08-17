const { ForbiddenError } = require('../errors');
const { ROLE_PERMISSIONS } = require('../config/permissions');
const { TOOL_ERROR_MESSAGES } = require('../lib/literature/errors.literature');
const toolRegistry = require('../tools/registry');

module.exports = function requireToolAccess(toolName) {
  return (req, res, next) => {
    // super_admin bypasses all permission checks
    if (req.isSuperAdmin) {
      req.resolvedTool = toolRegistry[toolName];
      return next();
    }

    const tool = toolRegistry[toolName];
    if (!tool) {
      return next(new ForbiddenError(TOOL_ERROR_MESSAGES.NOT_FOUND));
    }

    // Check business type compatibility
    if (tool.businessType && tool.businessType !== req.activeBusinessType) {
      return next(new ForbiddenError(TOOL_ERROR_MESSAGES.INCOMPATIBLE_BUSINESS_TYPE));
    }

    // Check permission (any-of semantics, matching sister APIs)
    const rolePermissions = ROLE_PERMISSIONS[req.activeRole] || [];
    const hasAccess = tool.requiredPermissions.some((p) => rolePermissions.includes(p));

    if (!hasAccess) {
      return next(new ForbiddenError(TOOL_ERROR_MESSAGES.UNAUTHORIZED));
    }

    req.resolvedTool = tool;
    next();
  };
};
