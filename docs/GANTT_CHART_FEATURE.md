# Gantt Chart Feature

## Overview

The Gantt chart feature allows you to visualize project tasks in a timeline view, making it easier to understand task schedules, dependencies, and project progress.

## Features

- **Timeline Visualization**: View tasks on a timeline with start and end dates
- **View Modes**: Switch between weekly and monthly views
- **Status Indicators**: Color-coded bars showing task status (todo, in progress, done)
- **Priority Indicators**: Left border colors indicating task priority (low, medium, high, critical)
- **Interactive**: Hover over tasks to see details
- **Responsive**: Works on desktop and mobile devices

## Setup

### 1. Database Migration

Before using the Gantt chart feature, you need to run the database migration to add date fields to tasks:

```bash
# Start your database (if using Docker)
docker-compose up -d

# Run the migration SQL
mysql -h localhost -P 3307 -u planner_user -p planner_ai < prisma/migrations/add_task_dates.sql
```

Or run the migration using Prisma:

```bash
npx prisma migrate dev --name add_task_dates
```

### 2. Regenerate Prisma Client

After running the migration, regenerate the Prisma client:

```bash
npx prisma generate
```

## Usage

### Viewing the Gantt Chart

1. Navigate to any project page
2. In the "Tasks" section, you'll see two view options:
   - **📋 Список** (List view) - Traditional task list
   - **📊 Диаграмма Ганта** (Gantt chart) - Timeline view
3. Click on "📊 Диаграмма Ганта" to switch to the Gantt chart view

### Adding Dates to Tasks

#### When Creating a New Task

1. Click "Создать задачу" (Create task)
2. Fill in the task details
3. Set the **Дата начала** (Start date) and **Дата окончания** (End date)
4. Submit the form

#### When Editing an Existing Task

1. Open the task details page
2. Click "Редактировать" (Edit)
3. Scroll to the "Даты" (Dates) section in the right sidebar
4. Set or update the start and end dates
5. Click "Сохранить" (Save)

### Understanding the Gantt Chart

#### Color Coding

**Status Colors:**
- Gray: To Do (todo)
- Yellow: In Progress (in_progress)
- Green: Done (done)

**Priority Border Colors:**
- Gray: Low priority
- Blue: Medium priority
- Orange: High priority
- Red: Critical priority

#### View Modes

- **По неделям** (Weekly): Shows tasks grouped by week, ideal for short-term planning
- **По месяцам** (Monthly): Shows tasks grouped by month, ideal for long-term planning

## Technical Details

### Components

- **`components/tasks/gantt-chart.tsx`**: Main Gantt chart component
- **`components/projects/project-view.tsx`**: Wrapper component with view toggle
- **`components/tasks/tasks-list.tsx`**: Traditional list view component

### Database Schema

```prisma
model Task {
  // ... other fields
  startDate   DateTime? // Planned start date
  endDate     DateTime? // Planned end date
  // ... other fields
}
```

### API Endpoints

The following endpoints support date fields:

- `POST /api/teams/[teamId]/projects/[projectId]/tasks` - Create task with dates
- `PATCH /api/teams/[teamId]/projects/[projectId]/tasks/[taskId]` - Update task dates

## Tips

1. **Tasks without dates**: Tasks without start/end dates won't appear in the Gantt chart
2. **Date validation**: The end date must be equal to or after the start date
3. **Best practices**:
   - Set realistic date ranges for tasks
   - Update task status as work progresses
   - Use priorities to highlight critical tasks
   - Review the Gantt chart regularly to track project progress

## Troubleshooting

### Gantt Chart Shows "No Tasks with Dates"

**Solution**: Add start and end dates to your tasks using the task creation or edit forms.

### TypeScript Errors After Schema Changes

**Solution**: Regenerate the Prisma client:
```bash
npx prisma generate
```

### Database Migration Fails

**Solution**:
1. Ensure your database is running
2. Check database connection settings in `.env`
3. Verify you have the correct permissions
4. Try running the SQL migration manually

## Future Enhancements

Potential improvements for the Gantt chart feature:

- Drag-and-drop to adjust task dates
- Task dependencies visualization
- Critical path highlighting
- Export to PDF/PNG
- Zoom controls for timeline
- Task filtering and search
- Milestone markers
- Resource allocation view
