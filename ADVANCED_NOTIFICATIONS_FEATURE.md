# Advanced Notifications Feature #13

## 🎯 Overview

Comprehensive notification system with smart routing, user preferences, @mentions, escalation rules, and Do-Not-Disturb scheduling.

---

## ✨ Features Implemented

### 1. **Smart Digest System**

- Group notifications by type and severity
- Intelligent daily/weekly digest mode
- Reduces notification fatigue
- Endpoint: `GET /notifications/digest?period=daily`

### 2. **Notification Preferences**

- **Per-notification-type settings:**
  - mention, message, task_assigned, task_completed
  - milestone, file_shared, project_update, deadline_reminder

- **Frequency options:**
  - `instant` - Immediate notification
  - `daily_digest` - Summarized at end of day
  - `weekly_digest` - Weekly summary
  - `never` - Disabled

- **Multi-channel support:**
  - in_app (dashboard), email, push notifications

- **Escalation rules:**
  - Auto-escalate unread mentions after N hours
  - Configurable delay (default: 24 hours)

### 3. **@Mentions & Smart Routing**

- Detect mentions in messages, tasks, comments
- Auto-create notifications with `type: "mention"`
- `severity: "critical"` for direct mentions
- Track mentioned_users array for multi-mentions
- Endpoint: `GET /notifications/mentions`

### 4. **Do-Not-Disturb (DND) Scheduling**

- **Time-based silence:**
  - Start time (e.g., 18:00)
  - End time (e.g., 09:00)
  - Supports crossing midnight

- **Day selection:**
  - Choose specific days (Mon-Fri, weekends, etc.)
  - Days: [0-6] where 0=Sunday

- **Smart filtering:**
  - `silence_all` - Complete silence during DND
  - `allow_critical_only` - Show mentions/critical alerts only

- **Timezone support** for accurate scheduling

### 5. **Escalation System**

- Monitor unread critical notifications
- Auto-escalate after configured delay
- Mark with `escalated: true`
- Get escalated count via `/notifications/stats`

### 6. **Notification Status Tracking**

- `is_read` - Read/unread status
- `is_read_at` - Timestamp when read
- `escalated` - Whether escalated
- `escalated_at` - Escalation timestamp
- `in_digest` - Part of digest instead of instant

---

## 📊 Database Schema

### NotificationPreference

```sql
- user_id (INT) - User reference
- project_id (INT, nullable) - null = global
- notification_type (ENUM) - Type of notification
- enabled (BOOLEAN) - Whether enabled
- frequency (ENUM) - instant/daily_digest/weekly_digest/never
- channels (JSON) - ['in_app', 'email', 'push']
- escalate_if_unread (BOOLEAN) - Auto-escalate unread
- escalation_delay_hours (INT) - Delay before escalation
- created_at, updated_at
```

### DoNotDisturbSchedule

```sql
- user_id (INT) - User reference
- enabled (BOOLEAN) - Whether DND is active
- start_time (TIME) - e.g., "18:00"
- end_time (TIME) - e.g., "09:00"
- days_of_week (JSON) - [0-6] day numbers
- silence_all (BOOLEAN) - Complete silence
- allow_critical_only (BOOLEAN) - Allow critical/mentions
- timezone (STRING) - User's timezone
- created_at, updated_at
```

### Notification (Updated)

```sql
- message (TEXT)
- user_id (INT)
- type (ENUM) - notification type
- severity (ENUM) - low/medium/high/critical
- is_read (BOOLEAN)
- is_read_at (DATETIME)
- mentioned_users (JSON) - [[user_id, ...]]
- related_resource (JSON) - { type: 'task', id: 123 }
- action_url (STRING)
- escalated (BOOLEAN)
- escalated_at (DATETIME)
- in_digest (BOOLEAN)
- created_at, updated_at
```

---

## 🔌 API Endpoints

### Notifications

```bash
GET    /notifications              - Get notifications (filtered, not in digest)
GET    /notifications?type=mention - Filter by type
GET    /notifications?severity=critical - Filter by severity
PUT    /notifications/:id          - Mark single as read
PUT    /notifications/             - Mark all as read
GET    /notifications/stats        - Get stats (unread, mentions, escalated)
GET    /notifications/mentions     - Get @mention notifications
GET    /notifications/digest       - Get smart digest
```

### Preferences

```bash
GET    /notifications/preferences/list         - Get all preferences
PUT    /notifications/preferences/:id          - Update preference
```

### Do-Not-Disturb

```bash
GET    /notifications/dnd/schedule             - Get DND schedule
POST   /notifications/dnd/schedule             - Create/update DND
PATCH  /notifications/dnd/toggle               - Toggle DND on/off
```

---

## 🖥️ UI Components

### NotificationSettings.js

- Tab-based interface
- Edit notification preferences per type
- Configure escalation rules
- Setup DND schedule with calendar interface
- Real-time updates

### NotificationBellAdvanced.js

- Enhanced notification bell icon
- Dropdown with smart filtering
- Unread badge
- Filter tabs: All, @Mentions, Urgent (critical/high)
- Real-time stats
- Mark as read functionality

---

## 🚀 Usage Examples

### Backend - Create Notification

```javascript
const notificationController = require("../controllers/notification/notificationController");

// Send mention notification
await notificationController.createNotification(userId, {
  message: "@John assigned you Task #42",
  type: "mention",
  severity: "critical",
  mentionedUsers: [userId],
  relatedResource: { type: "task", id: 42 },
  actionUrl: "/project/1/task/42",
  projectId: 1,
});
```

### Frontend - Display Notifications

```javascript
import NotificationBellAdvanced from '../components/common/NotificationBellAdvanced';
import NotificationSettings from '../components/common/NotificationSettings';

// In navbar/header
<NotificationBellAdvanced />

// In settings page
<NotificationSettings />
```

### Smart Routing Logic

```text
1. Get user preferences
2. Check if user is in DND period
3. If in DND:
   - If silence_all: queue for digest
   - If critical/mention and allow_critical_only: instant
   - Otherwise: queue for digest
4. If frequency is daily/weekly: queue for digest
5. Otherwise: instant notification
6. Set escalation timer if needed
```

---

## ⚙️ Configuration

### Default Preferences (Auto-created)

- mention: instant, escalate enabled
- message: daily digest
- task_assigned: instant
- task_completed: daily digest
- milestone: weekly digest
- file_shared: daily digest
- project_update: daily digest
- deadline_reminder: instant

### Default DND

- Enabled: false
- Time: 18:00 - 09:00 (evening to morning)
- Days: Monday-Friday (weekdays)
- Allow critical: true

---

## 🔄 Workflow Examples

### Scenario 1: User Gets @Mentioned During DND

```text
1. Mention notification created
2. Check preferences: type=mention, severity=critical
3. Check DND: enabled=true, in allowed time range
4. allow_critical_only=true, so send instantly (bypass DND)
5. Set escalation timer for 24 hours
```

### Scenario 2: Team Member Sends Message

```text
1. Message notification created
2. Check preferences: type=message, frequency=daily_digest
3. Check DND: enabled=false
4. in_digest = true (follow preference)
5. Queue for daily digest instead of instant
6. Show in digest at end of day
```

### Scenario 3: Task Assignment in Different Project

```text
1. Task assigned notification created
2. Check project-specific preference for project_id=5
3. If not found, fall back to global preference
4. Route based on setting
```

---

## 📊 Stats & Analytics

### GET /notifications/stats

```json
{
  "unread": 12,
  "mentions": 3,
  "escalated": 1,
  "digest_pending": 24
}
```

---

## 🔐 Security Notes

- User can only see their own notifications
- Filter by `user_id` on all queries
- DND is personal - can't modify others'
- Preferences are user-scoped

---

## 🚦 Testing Checklist

- [ ] Create notification with different types
- [ ] Test preference filters
- [ ] Test DND blocking during time range
- [ ] Test DND allowing critical during time
- [ ] Test escalation after N hours
- [ ] Test digest grouping by type/severity
- [ ] Test @mention detection
- [ ] Test preference override per project
- [ ] Test mark as read timestamps
- [ ] Test stats endpoint accuracy

---

## 🎁 Future Enhancements

- Email digest delivery
- Push notification delivery
- Mobile app notifications
- Notification history/archive
- Custom notification rules (if-this-then-that)
- Notification templates
- Batch notification optimization
- Read receipts for mentions
- Notification translation to multiple languages

---

## 📝 Integration Notes

To integrate into existing code:

1. **Run migrations** to create new tables
2. **Initialize preferences** for existing users
3. **Update notification creation** to use new controller
4. **Replace NotificationBell** with NotificationBellAdvanced
5. **Add settings page** route with NotificationSettings
6. **Update web socket** to respect DND/digest settings
