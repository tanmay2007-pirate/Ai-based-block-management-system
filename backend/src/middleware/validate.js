const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['engineering', 'traction', 'signal', 'control_office', 'admin']),
    department: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const tmsDefectSchema = z.object({
  body: z.object({
    asset_id: z.string().uuid('Invalid asset_id format').optional(),
    asset_type: z.string().min(1, 'asset_type is required'),
    location_km: z.number().finite('location_km must be a number').optional(),
    defect_type: z.string().min(1, 'defect_type is required'),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().optional(),
    reported_by: z.string().optional(),
  }),
});

const tdmsDefectSchema = z.object({
  body: z.object({
    asset_id: z.string().uuid('Invalid asset_id format').optional(),
    loco_number: z.string().min(1, 'loco_number is required'),
    loco_type: z.string().min(1, 'loco_type is required'),
    defect_type: z.string().min(1, 'defect_type is required'),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().optional(),
    depot: z.string().optional(),
    reported_by: z.string().optional(),
  }),
});

const smmsDefectSchema = z.object({
  body: z.object({
    asset_id: z.string().uuid('Invalid asset_id format').optional(),
    signal_id: z.string().min(1, 'signal_id is required'),
    signal_type: z.string().min(1, 'signal_type is required'),
    location_km: z.number().finite('location_km must be a number').optional(),
    defect_type: z.string().min(1, 'defect_type is required'),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string().optional(),
    reported_by: z.string().optional(),
  }),
});

const blockPlanSchema = z.object({
  body: z.object({
    section: z.string().min(1, 'section is required'),
    from_km: z.number().finite().optional(),
    to_km: z.number().finite().optional(),
    planned_start: z.string().datetime('planned_start must be ISO8601 datetime'),
    planned_end: z.string().datetime('planned_end must be ISO8601 datetime'),
    week_start: z.string().datetime().optional(),
    week_end: z.string().datetime().optional(),
    block_demand_id: z.string().uuid().optional(),
  }),
});

const blockDemandSchema = z.object({
  body: z.object({
    section: z.string().min(1, 'section is required'),
    from_km: z.number().finite(),
    to_km: z.number().finite(),
    demanded_for: z.string().datetime('demanded_for must be ISO8601 datetime'),
    duration_hours: z.number().positive('duration_hours must be positive'),
    reason: z.string().optional(),
  }),
});

const taskStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']),
    notes: z.string().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

const scheduleGenerateSchema = z.object({
  body: z.object({
    horizon: z.enum(['week', 'month']).optional().default('week'),
    proposedChanges: z.object({
      moves: z.array(z.object({
        taskId: z.string(),
        newStartTime: z.string().datetime(),
        corridorId: z.string(),
      })).optional(),
      combines: z.array(z.object({
        taskIds: z.array(z.string()).min(2),
        corridorId: z.string(),
        startTime: z.string().datetime(),
        endTime: z.string().datetime(),
      })).optional(),
    }).optional(),
  }),
});

const emergencyDefectSchema = z.object({
  body: z.object({
    asset_id: z.string().uuid('Invalid asset_id format'),
    section: z.string().min(1, 'section is required'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    description: z.string().min(1, 'description is required'),
    department: z.string().optional(),
    days_overdue: z.number().min(0).optional(),
    traffic_level: z.number().min(0).optional(),
    asset_type: z.string().optional(),
    criticality: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  }),
});

const emergencyNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'title is required'),
    message: z.string().min(1, 'message is required'),
    related_id: z.string().optional(),
  }),
});

const queryPaginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    department: z.string().optional(),
    status: z.string().optional(),
    severity: z.string().optional(),
  }),
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.flatten();
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors.fieldErrors,
      });
    }

    req.validated = result.data;
    next();
  };
}

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  tmsDefectSchema,
  tdmsDefectSchema,
  smmsDefectSchema,
  blockPlanSchema,
  blockDemandSchema,
  taskStatusSchema,
  scheduleGenerateSchema,
  emergencyDefectSchema,
  emergencyNotificationSchema,
  queryPaginationSchema,
  idParamSchema,
};