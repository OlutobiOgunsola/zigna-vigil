const { ROLE_PERMISSIONS } = require('../config/permissions');

module.exports = {
  hasPermission(role, permission) {
    if (role === 'super_admin') return true;
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    return rolePerms.includes(permission);
  },

  getAccessibleTools(role, toolRegistry) {
    if (role === 'super_admin') return Object.keys(toolRegistry);

    const rolePerms = ROLE_PERMISSIONS[role] || [];
    return Object.entries(toolRegistry)
      .filter(([, tool]) => tool.requiredPermissions.some((p) => rolePerms.includes(p)))
      .map(([name]) => name);
  },
};
