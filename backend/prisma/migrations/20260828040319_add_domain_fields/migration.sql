-- DropForeignKey
ALTER TABLE "planning"."maintenance_history" DROP CONSTRAINT "maintenance_history_task_id_fkey";

-- AlterTable
ALTER TABLE "core"."assets" ADD COLUMN     "asset_specification" TEXT,
ADD COLUMN     "condition_score" DOUBLE PRECISION,
ADD COLUMN     "criticality" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "design_life_years" INTEGER,
ADD COLUMN     "gauge" TEXT,
ADD COLUMN     "installation_date" TIMESTAMP(3),
ADD COLUMN     "last_inspection_date" TIMESTAMP(3),
ADD COLUMN     "last_major_maintenance_date" TIMESTAMP(3),
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "replacement_cost_estimate" DOUBLE PRECISION,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "station_location" TEXT,
ADD COLUMN     "total_past_defects" INTEGER,
ADD COLUMN     "total_past_failures" INTEGER,
ADD COLUMN     "traffic_level" INTEGER;

-- AlterTable
ALTER TABLE "planning"."maintenance_history" ADD COLUMN     "actual_repair_duration_min" INTEGER,
ADD COLUMN     "asset_id" TEXT,
ADD COLUMN     "completed_date" TIMESTAMP(3),
ADD COLUMN     "cost_incurred" DOUBLE PRECISION,
ADD COLUMN     "crew_size_used" INTEGER,
ADD COLUMN     "days_to_failure" INTEGER,
ADD COLUMN     "delay_reason" TEXT,
ADD COLUMN     "did_fail_within_30_days" BOOLEAN,
ADD COLUMN     "division" TEXT,
ADD COLUMN     "duration_variance_min" INTEGER,
ADD COLUMN     "estimated_duration_min" INTEGER,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "was_delayed" BOOLEAN,
ADD COLUMN     "weather_condition" TEXT,
ALTER COLUMN "task_id" DROP NOT NULL,
ALTER COLUMN "action" DROP NOT NULL;

-- AlterTable
ALTER TABLE "smms"."signalling_maintenance" ADD COLUMN     "asset_id" TEXT,
ADD COLUMN     "crew_size" INTEGER,
ADD COLUMN     "criticality" TEXT,
ADD COLUMN     "overdue_days" INTEGER,
ADD COLUMN     "preferred_end_time" TIMESTAMP(3),
ADD COLUMN     "preferred_start_time" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tdms"."traction_maintenance" ADD COLUMN     "asset_id" TEXT,
ADD COLUMN     "crew_size" INTEGER,
ADD COLUMN     "criticality" TEXT,
ADD COLUMN     "overdue_days" INTEGER,
ADD COLUMN     "preferred_end_time" TIMESTAMP(3),
ADD COLUMN     "preferred_start_time" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tms"."track_maintenance" ADD COLUMN     "crew_size" INTEGER,
ADD COLUMN     "criticality" TEXT,
ADD COLUMN     "overdue_days" INTEGER,
ADD COLUMN     "preferred_end_time" TIMESTAMP(3),
ADD COLUMN     "preferred_start_time" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "planning"."maintenance_history" ADD CONSTRAINT "maintenance_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "planning"."maintenance_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
