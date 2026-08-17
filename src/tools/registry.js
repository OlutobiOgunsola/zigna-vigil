const { PERMISSIONS } = require('../config/permissions');

const toolRegistry = {
  // ═══════════════════════════════════════════════════════════════════
  // ZignaLyft Tools (READ-ONLY)
  // ═══════════════════════════════════════════════════════════════════

  // ─── Members ──────────────────────────────────────────────────────
  'zignalyft.members.list': {
    name: 'zignalyft.members.list',
    description: 'Fetch the list of members for the active gym',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_MEMBERS_VIEW_ALL, PERMISSIONS.ZIGNALYFT_MEMBERS_VIEW_ASSIGNED],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status: active, suspended, all' },
        search: { type: 'string', description: 'Search by name, email, or phone' },
      },
    },
    handler: require('./zignalyft/members.list'),
  },

  'zignalyft.members.detail': {
    name: 'zignalyft.members.detail',
    description: 'Get detailed info for a single member including subscriptions, visits, and active plan',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_MEMBERS_VIEW_ALL, PERMISSIONS.ZIGNALYFT_MEMBERS_VIEW_ASSIGNED],
    parameters: {
      type: 'object',
      properties: {
        memberId: { type: 'number', description: 'The gym_membership_id of the member' },
      },
      required: ['memberId'],
    },
    handler: require('./zignalyft/members.detail'),
  },

  'zignalyft.members.analytics': {
    name: 'zignalyft.members.analytics',
    description: 'Get member analytics: growth trends, status breakdown, join date distribution',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_MEMBERS_VIEW_ALL],
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignalyft/members.analytics'),
  },

  // ─── Subscriptions ────────────────────────────────────────────────
  'zignalyft.subscriptions.list': {
    name: 'zignalyft.subscriptions.list',
    description: 'Fetch subscriptions with member and plan details',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_SUBSCRIPTIONS_VIEW],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: active, expired, cancelled' },
      },
    },
    handler: require('./zignalyft/subscriptions.list'),
  },

  'zignalyft.subscriptions.analytics': {
    name: 'zignalyft.subscriptions.analytics',
    description: 'Get subscription analytics: renewal rates, revenue, churn',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_SUBSCRIPTIONS_VIEW],
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignalyft/subscriptions.analytics'),
  },

  // ─── Plans ────────────────────────────────────────────────────────
  'zignalyft.plans.list': {
    name: 'zignalyft.plans.list',
    description: 'Fetch available membership plans with pricing',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_PLANS_VIEW],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: active, archived' },
      },
    },
    handler: require('./zignalyft/plans.list'),
  },

  // ─── Payments ─────────────────────────────────────────────────────
  'zignalyft.payments.list': {
    name: 'zignalyft.payments.list',
    description: 'Fetch payment history with member and plan details',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_PAYMENTS_VIEW],
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignalyft/payments.list'),
  },

  // ─── Classes ──────────────────────────────────────────────────────
  'zignalyft.classes.list': {
    name: 'zignalyft.classes.list',
    description: 'Fetch scheduled classes with instructor, bookings, and spots available',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_CLASSES_VIEW],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: scheduled, completed, cancelled' },
        scope: { type: 'string', description: 'Scope: upcoming (default) or all' },
      },
    },
    handler: require('./zignalyft/classes.list'),
  },

  // ─── Equipment ────────────────────────────────────────────────────
  'zignalyft.equipment.list': {
    name: 'zignalyft.equipment.list',
    description: 'Fetch gym equipment with status and category',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_EQUIPMENT_VIEW],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: operational, maintenance, out_of_service, retired' },
        category: { type: 'string', description: 'Filter: cardio, strength, functional, mobility, accessory' },
      },
    },
    handler: require('./zignalyft/equipment.list'),
  },

  'zignalyft.equipment.analytics': {
    name: 'zignalyft.equipment.analytics',
    description: 'Get equipment analytics: status breakdown, utilization, maintenance costs',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_EQUIPMENT_VIEW],
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        range: { type: 'string', description: 'Preset range: today, this_week, this_month, last_month, last_3_months' },
      },
    },
    handler: require('./zignalyft/equipment.analytics'),
  },

  'zignalyft.equipment.maintenance': {
    name: 'zignalyft.equipment.maintenance',
    description: 'Fetch maintenance logs for equipment',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_EQUIPMENT_VIEW],
    parameters: {
      type: 'object',
      properties: {
        equipment_id: { type: 'number', description: 'Filter by specific equipment ID' },
        status: { type: 'string', description: 'Filter: scheduled, in_progress, completed' },
      },
    },
    handler: require('./zignalyft/equipment.maintenance'),
  },

  // ─── Leads ────────────────────────────────────────────────────────
  'zignalyft.leads.list': {
    name: 'zignalyft.leads.list',
    description: 'Fetch leads (prospective members) with status and source',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_LEADS_VIEW_ALL, PERMISSIONS.ZIGNALYFT_LEADS_VIEW_ASSIGNED],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: new, contacted, trial_booked, converted, lost' },
        source: { type: 'string', description: 'Filter: walk_in, referral, social_media, online_ad, website, event, other' },
        search: { type: 'string', description: 'Search by name or phone' },
      },
    },
    handler: require('./zignalyft/leads.list'),
  },

  'zignalyft.leads.analytics': {
    name: 'zignalyft.leads.analytics',
    description: 'Get lead analytics: conversion rates, source breakdown, pipeline value',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_LEADS_VIEW_ALL],
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignalyft/leads.analytics'),
  },

  'zignalyft.leads.referrals': {
    name: 'zignalyft.leads.referrals',
    description: 'Fetch referral program data: who referred whom, conversion status, rewards',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_LEADS_VIEW_ALL],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: pending, converted, declined' },
      },
    },
    handler: require('./zignalyft/leads.referrals'),
  },

  // ─── Inventory ────────────────────────────────────────────────────
  'zignalyft.inventory.list': {
    name: 'zignalyft.inventory.list',
    description: 'Fetch inventory items (supplements, merchandise, accessories) with stock levels',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_INVENTORY_VIEW],
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter: supplement, merchandise, accessory, other' },
        low_stock: { type: 'boolean', description: 'If true, only show items at or below reorder level' },
      },
    },
    handler: require('./zignalyft/inventory.list'),
  },

  'zignalyft.inventory.analytics': {
    name: 'zignalyft.inventory.analytics',
    description: 'Get inventory analytics: stock value, turnover, low stock alerts',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_INVENTORY_VIEW],
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignalyft/inventory.analytics'),
  },

  'zignalyft.inventory.transactions': {
    name: 'zignalyft.inventory.transactions',
    description: 'Fetch inventory transaction history: restocks, sales, adjustments, damages',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_INVENTORY_VIEW],
    parameters: {
      type: 'object',
      properties: {
        transaction_type: { type: 'string', description: 'Filter: restock, sale, damaged, adjustment' },
        item_id: { type: 'number', description: 'Filter by specific inventory item ID' },
      },
    },
    handler: require('./zignalyft/inventory.transactions'),
  },

  // ─── Staff ────────────────────────────────────────────────────────
  'zignalyft.staff.list': {
    name: 'zignalyft.staff.list',
    description: 'Fetch all staff members (owner, admin, instructor) with roles and status',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_STAFF_VIEW],
    parameters: { type: 'object', properties: {} },
    handler: require('./zignalyft/staff.list'),
  },

  // ─── Instructors ──────────────────────────────────────────────────
  'zignalyft.instructors.list': {
    name: 'zignalyft.instructors.list',
    description: 'Fetch instructors with bio, specialty, and assigned member count',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_INSTRUCTORS_VIEW],
    parameters: { type: 'object', properties: {} },
    handler: require('./zignalyft/instructors.list'),
  },

  'zignalyft.instructors.assigned': {
    name: 'zignalyft.instructors.assigned',
    description: 'Fetch members assigned to a specific instructor',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_INSTRUCTORS_VIEW],
    parameters: {
      type: 'object',
      properties: {
        instructorId: { type: 'number', description: 'The gym_membership_id of the instructor' },
      },
      required: ['instructorId'],
    },
    handler: require('./zignalyft/instructors.assigned'),
  },

  // ─── Shifts ───────────────────────────────────────────────────────
  'zignalyft.shifts.list': {
    name: 'zignalyft.shifts.list',
    description: 'Fetch staff shifts with dates, times, and types',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_SHIFTS_VIEW],
    parameters: {
      type: 'object',
      properties: {
        shift_type: { type: 'string', description: 'Filter: opening, midday, closing, full' },
        staff_id: { type: 'number', description: 'Filter by staff gym_membership_id' },
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignalyft/shifts.list'),
  },

  'zignalyft.shifts.analytics': {
    name: 'zignalyft.shifts.analytics',
    description: 'Get shift analytics: coverage, hours worked, staff distribution',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_SHIFTS_VIEW],
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignalyft/shifts.analytics'),
  },

  // ─── Retention ────────────────────────────────────────────────────
  'zignalyft.retention.analytics': {
    name: 'zignalyft.retention.analytics',
    description: 'Get retention analytics: churn rates, goal completion, assessment trends',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_RETENTION_CHURN_VIEW, PERMISSIONS.ZIGNALYFT_RETENTION_GOALS_VIEW],
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
        range: { type: 'string', description: 'Preset: today, this_week, this_month, last_month, last_3_months' },
      },
    },
    handler: require('./zignalyft/retention.analytics'),
  },

  'zignalyft.retention.churn': {
    name: 'zignalyft.retention.churn',
    description: 'Fetch churn events: why members left, when, and notes',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_RETENTION_CHURN_VIEW],
    parameters: {
      type: 'object',
      properties: {
        churn_reason: { type: 'string', description: 'Filter: cost, relocation, schedule, results, injury, service, other' },
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignalyft/retention.churn'),
  },

  'zignalyft.retention.goals': {
    name: 'zignalyft.retention.goals',
    description: 'Fetch member fitness goals with progress and status',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_RETENTION_GOALS_VIEW, PERMISSIONS.ZIGNALYFT_RETENTION_GOALS_VIEW_OWN],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: active, achieved, abandoned' },
      },
    },
    handler: require('./zignalyft/retention.goals'),
  },

  'zignalyft.retention.assessments': {
    name: 'zignalyft.retention.assessments',
    description: 'Fetch member fitness assessments: body measurements, BMI, body fat, instructor notes',
    businessType: 'gym',
    requiredPermissions: [PERMISSIONS.ZIGNALYFT_RETENTION_ASSESSMENTS_VIEW, PERMISSIONS.ZIGNALYFT_RETENTION_ASSESSMENTS_VIEW_OWN],
    parameters: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        to: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignalyft/retention.assessments'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // ZignaStay Tools
  // ═══════════════════════════════════════════════════════════════════
  'zignastay.bookings.list': {
    name: 'zignastay.bookings.list',
    description: 'Fetch bookings for the active hotel',
    businessType: 'hotel',
    requiredPermissions: [PERMISSIONS.ZIGNASTAY_BOOKINGS_VIEW_ALL],
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter: confirmed, pending, cancelled' },
        date: { type: 'string', description: 'Filter by date (YYYY-MM-DD)' },
      },
    },
    handler: require('./zignastay/bookings.list'),
  },

  'zignastay.bookings.create': {
    name: 'zignastay.bookings.create',
    description: 'Create a new booking for the active hotel',
    businessType: 'hotel',
    requiredPermissions: [PERMISSIONS.ZIGNASTAY_BOOKINGS_CREATE],
    parameters: {
      type: 'object',
      properties: {
        guestName: { type: 'string', description: 'Guest full name' },
        roomId: { type: 'number', description: 'Room ID to book' },
        checkIn: { type: 'string', description: 'Check-in date (YYYY-MM-DD)' },
        checkOut: { type: 'string', description: 'Check-out date (YYYY-MM-DD)' },
      },
      required: ['guestName', 'checkIn', 'checkOut'],
    },
    handler: require('./zignastay/bookings.create'),
  },

  // ═══════════════════════════════════════════════════════════════════
  // Vigil Tools
  // ═══════════════════════════════════════════════════════════════════
  'vigil.usage.view': {
    name: 'vigil.usage.view',
    description: 'View AI usage statistics for the active business entity',
    businessType: null,
    requiredPermissions: [PERMISSIONS.VIGIL_USAGE_VIEW],
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'Filter by month (YYYY-MM). Defaults to current month.' },
        userId: { type: 'number', description: 'Filter by specific user ID' },
      },
    },
    handler: null,
  },
};

module.exports = toolRegistry;
