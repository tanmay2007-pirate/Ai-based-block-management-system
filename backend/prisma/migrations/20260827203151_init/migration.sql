-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "coa";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "planning";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "smms";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tdms";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "tms";

-- CreateTable
CREATE TABLE "core"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."assets" (
    "id" TEXT NOT NULL,
    "asset_code" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location_km" DOUBLE PRECISION,
    "zone" TEXT,
    "division" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."audit_log" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "performed_by" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "related_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tms"."track_maintenance" (
    "id" TEXT NOT NULL,
    "asset_id" TEXT,
    "asset_type" TEXT NOT NULL,
    "location_km" DOUBLE PRECISION,
    "defect_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "reported_by" TEXT,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "track_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tdms"."traction_maintenance" (
    "id" TEXT NOT NULL,
    "loco_number" TEXT NOT NULL,
    "loco_type" TEXT NOT NULL,
    "defect_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "depot" TEXT,
    "reported_by" TEXT,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "traction_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smms"."signalling_maintenance" (
    "id" TEXT NOT NULL,
    "signal_id" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "location_km" DOUBLE PRECISION,
    "defect_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "reported_by" TEXT,
    "reported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signalling_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coa"."train_operations" (
    "id" TEXT NOT NULL,
    "train_number" TEXT NOT NULL,
    "from_station" TEXT NOT NULL,
    "to_station" TEXT NOT NULL,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "arrival_time" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'on_time',
    "delay_minutes" INTEGER,
    "section" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "train_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning"."maintenance_tasks" (
    "id" TEXT NOT NULL,
    "source_system" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "priority_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "severity" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "department" TEXT NOT NULL,
    "asset_id" TEXT,
    "estimated_hours" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "ai_score_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning"."block_demands" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "from_km" DOUBLE PRECISION NOT NULL,
    "to_km" DOUBLE PRECISION NOT NULL,
    "demanded_by" TEXT NOT NULL,
    "demanded_for" TIMESTAMP(3) NOT NULL,
    "duration_hours" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "block_demands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning"."block_plans" (
    "id" TEXT NOT NULL,
    "block_demand_id" TEXT,
    "week_start" TIMESTAMP(3) NOT NULL,
    "week_end" TIMESTAMP(3) NOT NULL,
    "section" TEXT NOT NULL,
    "from_km" DOUBLE PRECISION NOT NULL,
    "to_km" DOUBLE PRECISION NOT NULL,
    "planned_start" TIMESTAMP(3) NOT NULL,
    "planned_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "conflict_flags" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "block_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning"."block_plan_trains" (
    "id" TEXT NOT NULL,
    "block_plan_id" TEXT NOT NULL,
    "task_id" TEXT,
    "train_number" TEXT,
    "impact_type" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_plan_trains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning"."maintenance_history" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_status" TEXT,
    "new_status" TEXT,
    "notes" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning"."scheduled_tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cron_expression" TEXT NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning"."conflicts" (
    "id" TEXT NOT NULL,
    "block_plan_id" TEXT NOT NULL,
    "conflict_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning"."approved_block_plans" (
    "id" TEXT NOT NULL,
    "block_plan_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "from_km" DOUBLE PRECISION NOT NULL,
    "to_km" DOUBLE PRECISION NOT NULL,
    "planned_start" TIMESTAMP(3) NOT NULL,
    "planned_end" TIMESTAMP(3) NOT NULL,
    "approved_by" TEXT NOT NULL,
    "approved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tasks_snapshot" JSONB,
    "metadata" JSONB,

    CONSTRAINT "approved_block_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "core"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "assets_asset_code_key" ON "core"."assets"("asset_code");

-- CreateIndex
CREATE UNIQUE INDEX "approved_block_plans_block_plan_id_key" ON "planning"."approved_block_plans"("block_plan_id");

-- AddForeignKey
ALTER TABLE "core"."audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning"."block_plans" ADD CONSTRAINT "block_plans_block_demand_id_fkey" FOREIGN KEY ("block_demand_id") REFERENCES "planning"."block_demands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning"."block_plan_trains" ADD CONSTRAINT "block_plan_trains_block_plan_id_fkey" FOREIGN KEY ("block_plan_id") REFERENCES "planning"."block_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning"."block_plan_trains" ADD CONSTRAINT "block_plan_trains_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "planning"."maintenance_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning"."maintenance_history" ADD CONSTRAINT "maintenance_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "planning"."maintenance_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning"."conflicts" ADD CONSTRAINT "conflicts_block_plan_id_fkey" FOREIGN KEY ("block_plan_id") REFERENCES "planning"."block_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
