import { randomUuid } from "../lib/uuid";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { statuses } from "../lib/types";

// This adapter shares the real API URLs. It never sends network requests.
const key = "tm-design-mock-v1";
const date = (offset = 0) =>
  new Date(Date.now() + offset * 86400000).toISOString();
const users = ["مدیر سامانه", "سارا احمدی", "علی رضایی", "مریم کریمی"].map(
  (name, i) => ({
    id: i + 1,
    name,
    username: ["admin", "sara", "ali", "maryam"][i],
    role: i === 0 ? "Admin" : i === 1 ? "Manager" : "Employee",
    permissions: ["tasks.read", "tasks.write", "projects.read"],
    enabled: true,
    authSource: "local",
    ldapUsername: "",
  }),
);
const projects = [
  "بازطراحی پرتال سازمانی",
  "یکپارچه‌سازی منابع انسانی",
  "داشبورد مدیریت هلدینگ",
].map((name, i) => ({
  id: `project-${i + 1}`,
  name,
  code: `PR-${101 + i}`,
  sponsor: "معاونت فناوری",
  managerId: 2,
  start: date(-20),
  end: date(40 + i * 10),
  budget: (i + 1) * 150000000,
  status: "فعال",
}));
const titles = [
  "طراحی صفحه اصلی",
  "بررسی نیازمندی‌ها",
  "تهیه گزارش ماهانه",
  "اصلاح فرآیند تایید",
  "تست رابط کاربری",
  "مستندسازی خدمات",
  "طراحی فرم ثبت درخواست",
  "بازبینی دسترسی‌ها",
  "بهینه‌سازی داشبورد",
  "جلسه هماهنگی تیم",
  "ارزیابی تجربه کاربری",
  "تحویل نسخه نهایی",
];
const tasks = titles.map((title, i) => ({
  id: `task-${i + 1}`,
  code: `TSK-${1001 + i}`,
  title,
  projectId: projects[i % 3].id,
  company: ["شرکت مادر", "فناوری آریا", "توسعه پارس"][i % 3],
  unit: "فناوری اطلاعات",
  management: "توسعه نرم‌افزار",
  assigneeId: 2 + (i % 3),
  start: date(-12 + i),
  due: date(i - 3),
  estimate: 8 + i * 2,
  source: "جلسه مدیریت",
  priority: ["عادی", "بالا", "فوری"][i % 3],
  status: statuses[i % statuses.length],
  progress: [0, 10, 45, 30, 90, 100][i % 6],
  description:
    "بررسی و اجرای نیازمندی‌های مصوب پروژه با همکاری تیم طراحی و توسعه.",
  expectedOutput: "نسخه قابل بررسی همراه با مستندات",
  deliveredOutput: i % 6 === 5 ? "نسخه نهایی تحویل داده شد." : "",
  blocker: i % 6 === 3 ? "در انتظار تایید مدیر پروژه" : "",
  quality: 4,
  version: "1",
}));
const events = [
  "task.created",
  "task.progress",
  "task.delivered",
  "extension.requested",
  "extension.decided",
  "task.reminder",
].map((id) => ({ id, name: id }));
const seed = () => ({
  users: structuredClone(users),
  projects: structuredClone(projects),
  tasks: structuredClone(tasks),
  settings: {
    email: true,
    sms: true,
    inApp: true,
    reminder: 2,
    approval: true,
  },
  history: tasks.map((t, i) => ({
    id: `history-${i}`,
    taskId: t.id,
    createdAt: date(-1),
    at: date(-1),
    actorId: t.assigneeId,
    action: "ثبت گزارش پیشرفت",
    userId: t.assigneeId,
    userName: users.find((u) => u.id === t.assigneeId)?.name,
    status: t.status,
    progress: t.progress,
    note: "گزارش پیشرفت فعالیت",
    hours: 3,
  })),
  extensions: [
    {
      id: "extension-1",
      taskId: "task-4",
      previousDue: date(-1),
      proposedDue: date(7),
      approverId: 1,
      requestedDue: date(7),
      newDue: date(7),
      reason: "نیاز به بررسی تکمیلی",
      status: "pending",
      createdAt: date(-1),
    },
  ],
  files: [
    {
      id: "file-1",
      taskId: "task-4",
      name: "راهنمای-پروژه.txt",
      size: 2400,
      createdAt: date(-1),
      contentType: "text/plain",
    },
  ] as any[],
  notifications: [
    "وظیفه جدید به شما ارجاع شد",
    "مهلت تحویل گزارش نزدیک است",
    "درخواست تمدید ثبت شد",
  ].map((message, i) => ({
    id: `notice-${i}`,
    message,
    channel: ["درون‌برنامه‌ای", "ایمیل", "پیامک"][i],
    createdAt: date(-i),
    read: i === 2,
    status: i === 1 ? "ناموفق (نمونه)" : "ارسال‌شده (نمونه)",
    recipientId: 1,
  })),
  integrations: {
    options: {
      ldap: {
        enabled: false,
        host: "ldap.example.test",
        port: 636,
        useSsl: true,
        allowInsecureDevelopment: false,
        baseDn: "dc=example,dc=test",
        bindDn: "",
        bindPassword: "",
        userAttribute: "uid",
      },
      email: {
        enabled: false,
        host: "smtp.example.test",
        port: 587,
        startTls: true,
        username: "",
        password: "",
        fromAddress: "tasks@example.test",
        fromName: "مدیریت وظایف",
      },
      sms: { enabled: false, url: "", token: "" },
      contacts: users.map((u) => ({
        userId: u.id,
        email: `${u.username}@example.test`,
        phone: "",
      })),
    },
    secrets: { ldapPassword: false, emailPassword: false, smsToken: false },
  },
  modules: {
    catalog: [
      {
        id: "kavenegar",
        name: "پیامک کاوه‌نگار",
        description: "ارسال اعلان‌های گردش کار از طریق پیامک",
        version: "1.0.0",
        capability: "sms",
        fields: [
          {
            key: "apiKey",
            label: "کلید API",
            type: "password",
            required: true,
            hint: "در نسخه ماک ارسال واقعی انجام نمی‌شود",
          },
          {
            key: "sender",
            label: "شماره فرستنده",
            type: "text",
            required: false,
            hint: "",
          },
        ],
        events: null,
      },
      {
        id: "workflow-audit",
        name: "ثبت رویداد گردش کار",
        description: "ماژول نمونه ثبت فعالیت‌ها",
        version: "1.0.0",
        capability: "workflow",
        fields: [],
        events: events.map((e) => e.id),
      },
    ],
    events,
    installed: [
      {
        id: "workflow-audit",
        enabled: true,
        events: events.map((e) => e.id),
        values: {},
        secrets: {},
      },
    ],
    deleted: [],
    smsWorkflowEnabled: true,
  },
  trash: [] as any[],
});
let state: any;
function db() {
  if (!state) {
    try {
      state = JSON.parse(localStorage.getItem(key) || "null");
    } catch {}
    state ||= seed();
  }
  return state;
}
function save() {
  localStorage.setItem(key, JSON.stringify(state));
}
const ok = (
  data: any = {
    message: "عملیات نمایشی با موفقیت انجام شد؛ ارسال واقعی انجام نمی‌شود.",
  },
) => ({ data: structuredClone(data) });
const fail = (status: number, message: string) => ({
  error: { status, data: { message } },
});
export const mockQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args) => {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const req = typeof args === "string" ? { url: args } : args;
  const path = req.url.replace(/^\/api\//, "").split("?")[0],
    parts = path.split("/");
  const method = req.method || "GET",
    body: any = req.body || {},
    s = db();
  if (path === "auth/login") {
    const user = s.users.find(
      (u: any) => u.username === body.username && u.enabled,
    );
    return user && body.password === "1234"
      ? ok({ token: "mock-session", user })
      : fail(401, "ورود نمایشی: admin / 1234");
  }
  if (path === "auth/logout") return ok();
  if (method === "GET") {
    if (path === "workspace" || path === "dashboard")
      return ok({
        tasks: s.tasks,
        projects: s.projects,
        users: s.users,
        settings: s.settings,
        companies: ["شرکت مادر", "فناوری آریا", "توسعه پارس"],
        units: ["فناوری اطلاعات", "منابع انسانی", "مالی"],
        statuses,
        priorities: ["عادی", "بالا", "فوری"],
      });
    if (path === "admin/users") return ok(s.users);
    if (path === "notifications") return ok(s.notifications);
    if (path === "settings/modules") return ok(s.modules);
    if (path === "settings/integrations")
      return ok({ ...s.integrations, users: s.users });
    if (parts[0] === "trash")
      return ok(
        s.trash
          .filter((r: any) => r.entity === parts[1])
          .map(({ record, ...r }: any) => r),
      );
    if (parts[0] === "tasks") {
      const task = s.tasks.find((t: any) => t.id === parts[1]);
      return task
        ? ok({
            task,
            history: s.history.filter((h: any) => h.taskId === task.id),
            extensions: s.extensions.filter((e: any) => e.taskId === task.id),
            attachments: s.files.filter((f: any) => f.taskId === task.id),
          })
        : fail(404, "وظیفه پیدا نشد");
    }
    return fail(404, "مسیر نمایشی تعریف نشده است: " + path);
  }
  let result: any;
  if (path === "settings") s.settings = { ...s.settings, ...body };
  else if (path === "settings/integrations") s.integrations.options = body;
  else if (path.includes("/test")) return ok();
  else if (parts[0] === "settings" && parts[1] === "modules") {
    const id = parts[2];
    if (method === "DELETE") {
      s.modules.installed = s.modules.installed.filter((m: any) => m.id !== id);
      s.modules.deleted.push({ id, deletedAt: date(), deletedBy: 1 });
    } else {
      const current = s.modules.installed.find((m: any) => m.id === id);
      if (current) Object.assign(current, body);
      else
        s.modules.installed.push({
          id,
          enabled: false,
          events: [],
          values: {},
          secrets: {},
          ...body,
        });
      s.modules.deleted = s.modules.deleted.filter((m: any) => m.id !== id);
    }
  } else if (parts[0] === "trash") {
    const r = s.trash.find(
      (r: any) => r.entity === parts[1] && String(r.id) === parts[2],
    );
    if (r) {
      s[r.entity].push(r.record);
      s.trash = s.trash.filter((x: any) => x !== r);
    }
  } else {
    const entity = parts[0] === "admin" ? "users" : parts[0];
    const id = parts[0] === "admin" ? parts[2] : parts[1],
      action = parts[2];
    const list = s[entity];
    if (!Array.isArray(list))
      return fail(400, "عملیات نمایشی پشتیبانی نمی‌شود");
    const item = list.find((x: any) => String(x.id) === id);
    if (method === "DELETE" && item) {
      s.trash.push({
        entity,
        id: String(item.id),
        label: item.title || item.name || item.message || item.note || id,
        deletedAt: date(),
        deletedBy: 1,
        batchId: null,
        record: item,
      });
      s[entity] = list.filter((x: any) => x !== item);
    } else if (!id) {
      result = {
        ...(entity === "tasks" ? tasks[0] : {}),
        ...body,
        id: entity === "users" ? Date.now() : randomUuid(),
        code: body.code || `NEW-${list.length + 1}`,
        version: "1",
      };
      list.push(result);
    } else if (entity === "tasks" && action === "files") {
      const file = body instanceof FormData ? (body.get("file") as File) : null;
      if (file)
        s.files.push({
          id: randomUuid(),
          taskId: id,
          name: file.name,
          size: file.size,
          createdAt: date(),
          contentType: file.type,
        });
    } else if (entity === "tasks" && action === "extensions")
      s.extensions.push({
        ...body,
        id: randomUuid(),
        taskId: id,
        status: "pending",
        createdAt: date(),
      });
    else if (item) {
      Object.assign(item, body);
      if (action === "read") item.read = true;
      if (action === "retry") item.status = "ارسال‌شده (نمونه)";
      if (action === "deliver") {
        item.status = "حل شده";
        item.progress = 100;
        item.deliveredOutput = body.output;
        if (body.accept) item.status = "بسته شده";
      }
      if (entity === "extensions" && action === "decide") {
        item.status = body.accept ? "approved" : "rejected";
        item.decisionNote = body.note;
        const task = s.tasks.find((t: any) => t.id === item.taskId);
        if (task && body.accept) task.due = item.proposedDue;
      }
      if (entity === "tasks" && action === "progress")
        s.history.push({
          ...body,
          id: randomUuid(),
          taskId: id,
          createdAt: date(),
          at: date(),
          userId: 1,
          actorId: 1,
        });
    }
  }
  save();
  return ok(result);
};
