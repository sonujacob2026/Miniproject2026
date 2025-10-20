# User Profile - Visual Layout Guide

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        UnifiedNavbar                             │
│                   [Back to Dashboard Button]                     │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────────────────────────┐
│              │                                                   │
│  SIDEBAR     │              MAIN CONTENT AREA                   │
│              │                                                   │
│ ┌──────────┐ │  ┌─────────────────────────────────────────────┐ │
│ │ Profile  │ │  │                                             │ │
│ │   👤     │ │  │         Active Section Content              │ │
│ └──────────┘ │  │                                             │ │
│              │  │  • Profile Form                             │ │
│ ┌──────────┐ │  │  • Password Change                          │ │
│ │ Password │ │  │  • Security Settings                        │ │
│ │   🔒     │ │  │  • Notification Settings                    │ │
│ └──────────┘ │  │  • General Settings                         │ │
│              │  │                                             │ │
│ ┌──────────┐ │  └─────────────────────────────────────────────┘ │
│ │ Security │ │                                                   │
│ │   🛡️     │ │                                                   │
│ └──────────┘ │                                                   │
│              │                                                   │
│ ┌──────────┐ │                                                   │
│ │ Notific. │ │                                                   │
│ │   🔔     │ │                                                   │
│ └──────────┘ │                                                   │
│              │                                                   │
│ ┌──────────┐ │                                                   │
│ │ Settings │ │                                                   │
│ │   ⚙️     │ │                                                   │
│ └──────────┘ │                                                   │
│              │                                                   │
└──────────────┴──────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │   Toast Notification │
                    │   ✅ Success!        │
                    └──────────────────────┘
                    (Bottom-right corner)
```

## 🎨 Profile Section Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  User Profile                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Full Name            │  │ Email                │            │
│  │ [Sonu Jacob      ]   │  │ [email@example.com]  │            │
│  │                      │  │ Email cannot be      │            │
│  │                      │  │ changed              │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Monthly Income       │  │ Household Members    │            │
│  │ [68501           ]   │  │ [6               ]   │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │ Savings Goal         │  │ Budgeting Experience │            │
│  │ [                ]   │  │ [Intermediate    ▼]  │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                  │
│  ┌──────────────────────┐                                       │
│  │ Debt Amount          │                                       │
│  │ [                ]   │                                       │
│  └──────────────────────┘                                       │
│                                                                  │
│  [Edit Profile]  or  [Save Changes] [Cancel]                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Password Section Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Change Password                                                 │
│  Update your password to keep your account secure               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Current Password                                                │
│  ┌────────────────────────────────────────────┐                 │
│  │ ••••••••••••                          👁️  │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  New Password                                                    │
│  ┌────────────────────────────────────────────┐                 │
│  │ ••••••••••••                          👁️  │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐            │
│  │ Password Requirements:                          │            │
│  │ ✅ At least 8 characters                        │            │
│  │ ✅ One uppercase letter (A-Z)                   │            │
│  │ ✅ One lowercase letter (a-z)                   │            │
│  │ ✅ One number (0-9)                             │            │
│  │ ❌ One special character (!@#$...)              │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                  │
│  Confirm New Password                                            │
│  ┌────────────────────────────────────────────┐                 │
│  │ ••••••••••••                          👁️  │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
│  [Change Password]                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🛡️ Security Settings Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Security Settings                                               │
│  Manage your account security preferences                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Two-Factor Authentication                          [ON]  │   │
│  │ Add an extra layer of security to your account           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Login Alerts                                       [ON]  │   │
│  │ Get notified of new login attempts                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Session Timeout                                          │   │
│  │ Automatically log out after period of inactivity         │   │
│  │ [30 minutes                                          ▼]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Save Security Settings]                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔔 Notifications Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Notification Settings                                           │
│  Choose what notifications you want to receive                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Email Notifications                                [ON]  │   │
│  │ Receive updates via email                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Push Notifications                                [OFF] │   │
│  │ Receive push notifications on your device                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Budget Alerts                                      [ON]  │   │
│  │ Get notified when you exceed your budget                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Expense Reminders                                  [ON]  │   │
│  │ Reminders to log your daily expenses                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Weekly Reports                                     [ON]  │   │
│  │ Receive weekly spending summaries                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [Save Notification Settings]                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📱 Mobile Layout (Responsive)

```
┌─────────────────────────┐
│     UnifiedNavbar       │
│  [Back to Dashboard]    │
└─────────────────────────┘

┌─────────────────────────┐
│  Navigation Buttons     │
│  ┌───────────────────┐  │
│  │ 👤 Profile        │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🔒 Password       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🛡️ Security       │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ 🔔 Notifications  │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ ⚙️ Settings       │  │
│  └───────────────────┘  │
└─────────────────────────┘

┌─────────────────────────┐
│                         │
│   Content Area          │
│   (Full Width)          │
│                         │
│   Form Fields           │
│   Stack Vertically      │
│                         │
└─────────────────────────┘
```

## 🎯 Interactive Elements

### Toggle Switch States

**OFF State:**
```
┌─────────────┐
│ ○           │  Gray background
└─────────────┘
```

**ON State:**
```
┌─────────────┐
│           ● │  Green background
└─────────────┘
```

### Password Visibility Toggle

**Hidden:**
```
┌────────────────────┐
│ ••••••••••    👁️  │
└────────────────────┘
```

**Visible:**
```
┌────────────────────┐
│ MyPassword123  👁️‍🗨️ │
└────────────────────┘
```

### Validation States

**Valid Field:**
```
┌────────────────────┐
│ John Doe           │  Green border
└────────────────────┘
```

**Invalid Field:**
```
┌────────────────────┐
│ 123                │  Red border
└────────────────────┘
⚠️ Full name must contain only letters
```

### Button States

**Normal:**
```
┌──────────────┐
│ Save Changes │  Green background
└──────────────┘
```

**Loading:**
```
┌──────────────┐
│ Saving...    │  Green background, 50% opacity
└──────────────┘
```

**Disabled:**
```
┌──────────────┐
│ Save Changes │  Gray background, cursor not-allowed
└──────────────┘
```

## 🎨 Color Coding

### Status Colors
- 🟢 **Green**: Active, Success, Valid
- 🔴 **Red**: Error, Invalid, Danger
- ⚪ **Gray**: Inactive, Disabled, Neutral
- 🔵 **Blue**: Info, Links (if used)

### Section Colors
- **Sidebar Active**: Green 600 background, white text
- **Sidebar Inactive**: Gray 700 text, hover gray 100 background
- **Input Focus**: Green 500 ring
- **Error State**: Red 500 border and text

## 📏 Spacing Guidelines

- **Section Padding**: 8-12 (2rem-3rem)
- **Card Padding**: 4-6 (1rem-1.5rem)
- **Input Padding**: 3-4 (0.75rem-1rem)
- **Gap Between Elements**: 4-6 (1rem-1.5rem)
- **Gap Between Sections**: 6-8 (1.5rem-2rem)

## 🔤 Typography

- **Page Title**: 2xl (1.5rem), Bold, Gray 800
- **Section Description**: sm (0.875rem), Regular, Gray 600
- **Label**: sm (0.875rem), Medium, Gray 700
- **Input Text**: base (1rem), Regular, Gray 900
- **Helper Text**: xs (0.75rem), Regular, Gray 500
- **Error Text**: xs (0.75rem), Regular, Red 600

---

**Note**: This layout is fully responsive and adapts to different screen sizes. On mobile devices, the sidebar stacks vertically above the content area.