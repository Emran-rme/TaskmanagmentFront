import { useState } from "react";
import {
  Workflow,
  Trash2,
  Plus,
  Copy,
  Save,
  Rocket,
  Layers3,
  MousePointer2,
  X,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import WorkflowNodeDrawer from "../components/WorkflowNodeDrawer";
import DeleteWorkflowDialog from "../components/DeleteWorkflowDialog";
import WorkflowStageIcon from "../components/WorkflowStageIcon";
import "../workflow.css";
import { randomUuid } from "../lib/uuid";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  RootState,
  useWorkflowCatalogQuery,
  useWorkspaceQuery,
  useMutateMutation,
  errorText,
} from "../store";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import WorkflowCanvas, { type CanvasNode } from "../components/WorkflowCanvas";
import {
  type FlowDefinition,
  type FlowGraph,
  type FlowKind,
  flowLabels,
  ports,
  portLabels,
} from "../lib/workflows";
import {
  Card,
  Field,
  input,
  button,
  secondary,
  Loading,
  ErrorBox,
} from "../components/ui";

export default function Workflows() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: catalog, error } = useWorkflowCatalogQuery(undefined, {
    skip: user?.role !== "Admin",
  });
  const { data: workspace } = useWorkspaceQuery();
  const [mutate, { isLoading }] = useMutateMutation();
  const [definition, setDefinition] = useState<FlowDefinition | null>(null);
  const [graph, setGraph] = useState<FlowGraph>({ nodes: [], edges: [] });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<FlowDefinition | null>(null);
  if (user?.role !== "Admin")
    return <ErrorBox message="این بخش مخصوص مدیر سیستم است." />;
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!catalog || !workspace) return <Loading />;
  const readonly = !!definition?.published;
  const node = graph.nodes.find((n) => n.id === selected);
  function open(d: FlowDefinition) {
    setDefinition(d);
    setGraph(JSON.parse(d.graphJson));
    setSelected("");
    setDirty(false);
    setMessage("");
    setPending(null);
  }
  function create() {
    const d = {
      id: randomUuid(),
      name: "گردش‌کار وظیفه",
      company: workspace!.companies[0] || "",
      projectId: null,
      version: 0,
      revision: 1,
      published: false,
      active: false,
      graphJson: JSON.stringify(catalog!.template),
    };
    open(d);
    setDirty(true);
  }
  function clone() {
    if (!definition) return;
    open({
      ...definition,
      id: randomUuid(),
      published: false,
      active: false,
      version: 0,
      revision: 1,
      name: definition.name,
      graphJson: JSON.stringify(graph),
    });
    setDirty(true);
  }
  function updateNode(patch: Partial<typeof node>) {
    setGraph((g) => ({
      ...g,
      nodes: g.nodes.map((n) => (n.id === selected ? { ...n, ...patch } : n)),
    }));
    setDirty(true);
  }
  async function save() {
    if (!definition) return;
    try {
      const d = await mutate({
        url: "workflows",
        body: { ...definition, graphJson: JSON.stringify(graph) },
      }).unwrap();
      open(d);
      toast.success("پیش‌نویس ذخیره شد.");
    } catch (e) {
      setMessage(errorText(e));
    }
  }
  async function activate(d: FlowDefinition) {
    try {
      const saved = await mutate({
        url: `workflows/${d.id}/activate`,
        body: { revision: d.revision },
      }).unwrap();
      open(saved);
      toast.success("نسخه برای تسک‌های جدید فعال شد.");
    } catch (e) {
      setMessage(errorText(e));
    } finally {
      setPending(null);
    }
  }
  async function disable(d: FlowDefinition) {
    try {
      await mutate({
        url: `workflows/${d.id}/disable`,
        body: { revision: d.revision },
      }).unwrap();
      setDefinition({ ...d, active: false, revision: d.revision + 1 });
      toast.success("تخصیص این الگو برای تسک‌های جدید متوقف شد.");
    } catch (e) {
      setMessage(errorText(e));
    }
  }
  return (
    <div className="workflow-page" dir="rtl">
      {deleteOpen && definition && (
        <DeleteWorkflowDialog
          definition={definition}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            setDeleteOpen(false);
            setDefinition(null);
            setGraph({ nodes: [], edges: [] });
            setDirty(false);
            setSelected("");
          }}
        />
      )}
      <div className="workflow-hero">
        <div className="workflow-hero-copy">
          <span className="workflow-hero-symbol">
            <Workflow size={28} strokeWidth={1.6} />
          </span>
          <div>
            <span className="workflow-eyebrow">فرایندهای تیم شما</span>
            <h1>طراح گردش‌کار</h1>
            <p>از ثبت وظیفه تا تأیید نهایی؛ مسیر همکاری تیم را طراحی کنید.</p>
          </div>
        </div>
        <button
          className={button}
          onClick={create}
          disabled={isLoading || dirty}
        >
          <Plus size={17} /> الگوی جدید
        </button>
      </div>
      {!catalog.enabled && (
        <ErrorBox message="موتور گردش‌کار در تنظیمات سرور غیرفعال است؛ الگوها اجرا نمی‌شوند." />
      )}
      <div className="workflow-version-note">
        <ShieldCheck size={17} />
        <p>
          هر تسک با نسخه خودش ادامه می‌یابد. تغییر نسخه فعال فقط روی تسک‌های
          جدید اثر دارد.
        </p>
        <span>
          {catalog.definitions
            .filter((d) => d.active)
            .length.toLocaleString("fa-IR")}{" "}
          الگوی فعال
        </span>
      </div>
      {dirty && (
        <p role="status" className="workflow-unsaved">
          تغییرات ذخیره‌نشده دارید؛ قبل از تعویض الگو آن‌ها را ذخیره کنید.
        </p>
      )}
      {message && <ErrorBox message={message} />}
      <div className="workflow-layout">
        <Card className="workflow-library">
          <div className="workflow-panel-title">
            <Layers3 size={18} />
            <h2>الگوها و نسخه‌ها</h2>
            <span>{catalog.definitions.length.toLocaleString("fa-IR")}</span>
          </div>
          {!catalog.definitions.length && (
            <div className="workflow-library-empty">
              <Layers3 size={30} />
              <p>هنوز الگویی نساخته‌اید</p>
              <small>اولین مسیر تیم را طراحی کنید.</small>
            </div>
          )}
          <div className="workflow-version-list">
            {catalog.definitions.map((d) => (
              <button
                disabled={dirty || isLoading}
                className={`workflow-version-card ${definition?.id === d.id ? "workflow-active-version" : ""}`}
                aria-pressed={definition?.id === d.id}
                key={d.id}
                onClick={() => open(d)}
              >
                <div className="workflow-version-heading">
                  <span className="workflow-library-icon">
                    <Workflow size={17} />
                  </span>
                  <strong>{d.name}</strong>
                </div>
                <span>
                  {d.company} ·{" "}
                  {d.projectId
                    ? workspace.projects.find((p) => p.id === d.projectId)
                        ?.name || "پروژه"
                    : "پیش‌فرض شرکت"}
                </span>
                <div className="workflow-version-meta">
                  <span>
                    {d.published
                      ? `نسخه ${d.version.toLocaleString("fa-IR")}`
                      : "پیش‌نویس"}
                  </span>
                  <span
                    className={`workflow-badge ${d.active ? "is-live" : d.published ? "is-published" : "is-draft"}`}
                  >
                    {d.active
                      ? "فعال"
                      : d.published
                        ? "منتشرشده"
                        : "در حال طراحی"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
        <Card className="workflow-editor-card">
          {definition ? (
            <>
              <div className="workflow-editor-heading">
                <div>
                  <span className="workflow-eyebrow">فضای طراحی</span>
                  <h2>{definition.name}</h2>
                </div>
                <div className="workflow-editor-counts">
                  <span>
                    {graph.nodes.length.toLocaleString("fa-IR")} مرحله
                  </span>
                  <span>
                    {graph.edges.length.toLocaleString("fa-IR")} اتصال
                  </span>
                </div>
              </div>
              <div className="workflow-toolbar workflow-actions">
                {catalog.definitions.some((d) => d.id === definition.id) && (
                  <button
                    className={`${secondary} workflow-delete-trigger`}
                    disabled={isLoading || dirty}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 size={15} />
                    حذف گردش‌کار و زیرمجموعه‌ها
                  </button>
                )}
                <button
                  className={secondary}
                  onClick={clone}
                  disabled={isLoading}
                >
                  <Copy size={15} /> کپی به پیش‌نویس جدید
                </button>
                {!readonly && (
                  <button
                    className={button}
                    disabled={isLoading || !dirty}
                    onClick={save}
                  >
                    <Save size={15} /> ذخیره پیش‌نویس
                  </button>
                )}
                <button
                  className={button}
                  disabled={isLoading || dirty}
                  onClick={() => setPending(definition)}
                >
                  <Rocket size={15} />
                  {readonly ? "فعال‌سازی این نسخه" : "اعتبارسنجی و انتشار"}
                </button>
                {definition.active && (
                  <button
                    className={secondary}
                    disabled={isLoading}
                    onClick={() => disable(definition)}
                  >
                    غیرفعال کردن تخصیص
                  </button>
                )}
                {dirty && (
                  <button
                    className={secondary}
                    onClick={() => {
                      setDefinition(null);
                      setDirty(false);
                    }}
                  >
                    کنار گذاشتن تغییرات
                  </button>
                )}
              </div>
              {pending && (
                <div className="workflow-confirm" role="alert">
                  <p>
                    این نسخه برای تسک‌های جدید این محدوده فعال شود؟ نسخه تسک‌های
                    موجود تغییر نمی‌کند.
                  </p>
                  <button
                    className={button}
                    disabled={isLoading}
                    onClick={() => activate(pending)}
                  >
                    تأیید انتشار و فعال‌سازی
                  </button>{" "}
                  <button
                    className={secondary}
                    onClick={() => setPending(null)}
                  >
                    انصراف
                  </button>
                </div>
              )}
              <div className="workflow-scope-fields">
                <Field label="نام الگو">
                  <input
                    className={input}
                    maxLength={200}
                    value={definition.name}
                    disabled={readonly}
                    onChange={(e) => {
                      setDefinition({ ...definition, name: e.target.value });
                      setDirty(true);
                    }}
                  />
                </Field>
                <Field label="شرکت">
                  <select
                    className={input}
                    value={definition.company}
                    disabled={
                      readonly ||
                      catalog.definitions.some((d) => d.id === definition.id)
                    }
                    onChange={(e) => {
                      setDefinition({
                        ...definition,
                        company: e.target.value,
                        projectId: null,
                      });
                      setDirty(true);
                    }}
                  >
                    {workspace.companies.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="تخصیص">
                  <select
                    className={input}
                    value={definition.projectId || ""}
                    disabled={
                      readonly ||
                      catalog.definitions.some((d) => d.id === definition.id)
                    }
                    onChange={(e) => {
                      setDefinition({
                        ...definition,
                        projectId: e.target.value || null,
                      });
                      setDirty(true);
                    }}
                  >
                    <option value="">پیش‌فرض شرکت</option>
                    {workspace.projects
                      .filter((p) => p.company === definition.company)
                      .map((p) => (
                        <option value={p.id} key={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>
              {!readonly && (
                <section className="workflow-palette">
                  <div className="workflow-palette-heading">
                    <span>
                      <Plus size={15} />
                      افزودن مرحله
                    </span>
                    <small>یک مرحله را انتخاب کنید و مسیر را بسازید</small>
                  </div>
                  <div className="workflow-palette-items">
                    {(Object.keys(flowLabels) as FlowKind[]).map((kind) => (
                      <button
                        className={`workflow-palette-item workflow-kind-${kind}`}
                        key={kind}
                        onClick={() => {
                          const n = {
                            id: randomUuid(),
                            kind,
                            label: flowLabels[kind],
                            x: 250,
                            y: graph.nodes.length * 100,
                            channel: "درون‌برنامه‌ای",
                            recipient: "assignee",
                            message: "وظیفه {code}: {title}",
                            minutes: 60,
                            condition: "priority",
                            value: "بالا",
                          };
                          setGraph({ ...graph, nodes: [...graph.nodes, n] });
                          setSelected(n.id);
                          setDirty(true);
                        }}
                      >
                        <span className="workflow-stage-icon">
                          <WorkflowStageIcon kind={kind} size={17} />
                        </span>
                        <span>{flowLabels[kind]}</span>
                        <Plus size={12} className="workflow-palette-plus" />
                      </button>
                    ))}
                  </div>
                </section>
              )}
              <div className="workflow-editor-grid">
                <WorkflowCanvas
                  key={definition.id}
                  graph={graph}
                  selectedNodeId={selected}
                  editable={!readonly}
                  onSelect={setSelected}
                  onConnect={(c) => {
                    if (!c.source || !c.target) return;
                    setGraph((g) => ({
                      ...g,
                      edges: [
                        ...g.edges,
                        {
                          id: randomUuid(),
                          source: c.source,
                          target: c.target,
                          port: c.sourceHandle || "next",
                        },
                      ],
                    }));
                    setDirty(true);
                  }}
                  onNodesChange={(changes) => {
                    if (readonly) return;
                    const onlyChanges = changes.filter(
                      (c) => c.type === "remove" || c.type === "position",
                    );
                    if (!onlyChanges.length) return;
                    setGraph((g) => {
                      const nodes = applyNodeChanges<CanvasNode>(
                        onlyChanges,
                        g.nodes.map((field) => ({
                          id: field.id,
                          type: "workflow",
                          position: { x: field.x, y: field.y },
                          data: { field, current: false },
                        })),
                      );
                      return {
                        nodes: nodes.map((n) => ({
                          ...n.data.field,
                          x: n.position.x,
                          y: n.position.y,
                        })),
                        edges: g.edges.filter(
                          (e) =>
                            nodes.some((n) => n.id === e.source) &&
                            nodes.some((n) => n.id === e.target),
                        ),
                      };
                    });
                    setDirty(true);
                  }}
                  onEdgesChange={(changes) => {
                    if (readonly) return;
                    const relevant = changes.filter((c) => c.type === "remove");
                    if (!relevant.length) return;
                    setGraph((g) => ({
                      ...g,
                      edges: applyEdgeChanges(
                        relevant,
                        g.edges.map((e) => ({ ...e, sourceHandle: e.port })),
                      ).map((e) => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        port: e.sourceHandle || "next",
                      })),
                    }));
                    setDirty(true);
                  }}
                />
                {node && (
                  <WorkflowNodeDrawer key={node.id} onClose={() => setSelected("")}>
                    <div className="workflow-properties">
                      <div
                        className={`workflow-inspector-heading workflow-kind-${node.kind}`}
                      >
                        <span className="workflow-stage-icon">
                          <WorkflowStageIcon kind={node.kind} />
                        </span>
                        <div>
                          <small>شخصی‌سازی مرحله</small>
                          <strong>{flowLabels[node.kind]}</strong>
                        </div>
                        <button
                          type="button"
                          className={secondary}
                          onClick={() => setSelected("")}
                          aria-label="بستن تنظیمات مرحله"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      {readonly && (
                        <p>
                          این نسخه منتشر شده است؛ برای ویرایش، آن را به پیش‌نویس
                          جدید کپی کنید.
                        </p>
                      )}
                      <fieldset disabled={readonly}>
                        <h3 className="workflow-inspector-section-title">
                          اطلاعات مرحله
                        </h3>
                        <Field label="عنوان گره">
                          <input
                            className={input}
                            value={node.label}
                            maxLength={150}
                            onChange={(e) =>
                              updateNode({ label: e.target.value })
                            }
                          />
                        </Field>
                        {node.kind === "assign" && (
                          <p>
                            این گره از انجام‌دهنده و ناظر انتخاب‌شده هنگام ثبت
                            وظیفه استفاده می‌کند.
                          </p>
                        )}
                        {node.kind === "notify" && (
                          <>
                            <Field label="کانال">
                              <select
                                className={input}
                                value={node.channel}
                                onChange={(e) =>
                                  updateNode({ channel: e.target.value })
                                }
                              >
                                {["درون‌برنامه‌ای", "ایمیل", "پیامک"].map(
                                  (c) => (
                                    <option key={c}>{c}</option>
                                  ),
                                )}
                              </select>
                            </Field>
                            <Field label="گیرنده">
                              <select
                                className={input}
                                value={node.recipient}
                                onChange={(e) =>
                                  updateNode({ recipient: e.target.value })
                                }
                              >
                                <option value="assignee">انجام‌دهندگان</option>
                                <option value="approver">ناظر</option>
                              </select>
                            </Field>
                            <Field label="متن پیام؛ متغیرها: {title} و {code}">
                              <textarea
                                className={input}
                                value={node.message}
                                maxLength={1500}
                                onChange={(e) =>
                                  updateNode({ message: e.target.value })
                                }
                              />
                            </Field>
                          </>
                        )}
                        {node.kind === "delay" && (
                          <Field label="مدت انتظار (دقیقه)">
                            <input
                              className={input}
                              type="number"
                              min={1}
                              max={525600}
                              value={node.minutes}
                              onChange={(e) =>
                                updateNode({ minutes: Number(e.target.value) })
                              }
                            />
                          </Field>
                        )}
                        {node.kind === "condition" && (
                          <>
                            <Field label="فیلد شرط">
                              <select
                                className={input}
                                value={node.condition}
                                onChange={(e) =>
                                  updateNode({ condition: e.target.value })
                                }
                              >
                                <option value="priority">اولویت برابر</option>
                                <option value="company">شرکت برابر</option>
                                <option value="progress">
                                  درصد پیشرفت حداقل
                                </option>
                              </select>
                            </Field>
                            <Field label="مقدار">
                              <input
                                className={input}
                                value={node.value}
                                onChange={(e) =>
                                  updateNode({ value: e.target.value })
                                }
                              />
                            </Field>
                          </>
                        )}
                        <div className="workflow-stage-help">
                          {
                            {
                              start: "این مرحله هنگام ثبت وظیفه اجرا می‌شود.",
                              assign:
                                "مسئول و ناظر از اطلاعات وظیفه انتخاب می‌شوند و دسترسی آن‌ها در سرور کنترل می‌شود.",
                              work: "انجام‌دهنده خروجی را ثبت می‌کند تا مسیر ادامه یابد.",
                              approval:
                                "فقط مالک/ناظر همان تسک یا مدیر سیستم می‌تواند تأیید یا برگشت بزند.",
                              notify:
                                "این پیام از صف اطلاع‌رسانی و تنظیمات ماژول انتخاب‌شده ارسال می‌شود.",
                              condition:
                                "با نتیجه شرط، یکی از مسیرهای بله یا خیر اجرا می‌شود.",
                              delay:
                                "مدت انتظار ذخیره می‌شود و پس از ری‌استارت هم ادامه می‌یابد.",
                              close:
                                "تسک پس از تأیید ناظر و بسته بودن زیروظایف بسته می‌شود.",
                              end: "اجرای گردش‌کار پایان می‌یابد.",
                            }[node.kind]
                          }
                        </div>
                        <h3>مسیرهای خروجی</h3>
                        {ports(node.kind).map((port) => (
                          <Field label={`مسیر ${portLabels[port]}`} key={port}>
                            <select
                              className={input}
                              value={
                                graph.edges.find(
                                  (e) =>
                                    e.source === node.id && e.port === port,
                                )?.target || ""
                              }
                              onChange={(e) => {
                                const target = e.target.value;
                                setGraph((g) => ({
                                  ...g,
                                  edges: [
                                    ...g.edges.filter(
                                      (edge) =>
                                        edge.source !== node.id ||
                                        edge.port !== port,
                                    ),
                                    ...(target
                                      ? [
                                          {
                                            id: randomUuid(),
                                            source: node.id,
                                            target,
                                            port,
                                          },
                                        ]
                                      : []),
                                  ],
                                }));
                                setDirty(true);
                              }}
                            >
                              <option value="">انتخاب مرحله بعد</option>
                              {graph.nodes
                                .filter(
                                  (n) => n.id !== node.id && n.kind !== "start",
                                )
                                .map((n) => (
                                  <option key={n.id} value={n.id}>
                                    {n.label} · {flowLabels[n.kind]}
                                  </option>
                                ))}
                            </select>
                          </Field>
                        ))}
                        {!readonly && (
                          <div className="workflow-toolbar">
                            <button
                              type="button"
                              className={secondary}
                              onClick={() => {
                                const copy = {
                                  ...node,
                                  id: randomUuid(),
                                  label: node.label + " (کپی)",
                                  x: node.x + 240,
                                  y: node.y + 40,
                                };
                                setGraph((g) => ({
                                  ...g,
                                  nodes: [...g.nodes, copy],
                                }));
                                setSelected(copy.id);
                                setDirty(true);
                              }}
                            >
                              تکثیر مرحله
                            </button>
                            <button
                              type="button"
                              className={secondary}
                              onClick={() => {
                                setGraph((g) => ({
                                  nodes: g.nodes.filter(
                                    (n) => n.id !== node.id,
                                  ),
                                  edges: g.edges.filter(
                                    (e) =>
                                      e.source !== node.id &&
                                      e.target !== node.id,
                                  ),
                                }));
                                setSelected("");
                                setDirty(true);
                              }}
                            >
                              حذف مرحله
                            </button>
                          </div>
                        )}
                      </fieldset>
                    </div>
                  </WorkflowNodeDrawer>
                )}
              </div>
              <p className="workflow-canvas-help">
                <MousePointer2 size={15} />
                <span>
                  اتصال‌ها را با کشیدن خروجی هر گره به ورودی گره بعد بسازید.
                  برای حذف، گره یا اتصال را انتخاب و Delete را بزنید. هر خروجی
                  باید یک اتصال داشته باشد. مسیر بستن باید از تأیید ناظر عبور
                  کند.
                </span>
              </p>
            </>
          ) : (
            <div className="workflow-welcome">
              <span className="workflow-welcome-icon">
                <Workflow size={42} strokeWidth={1.4} />
              </span>
              <span className="workflow-eyebrow">
                یک مسیر روشن برای هر وظیفه
              </span>
              <h2>اینجا، همکاری تیم شکل می‌گیرد</h2>
              <p>
                مراحل انجام، بررسی و اطلاع‌رسانی را کنار هم بچینید.
                <br />
                از یک الگوی آماده شروع کنید و آن را برای تیم خود تغییر دهید.
              </p>
              <div className="workflow-welcome-stages">
                {(["start", "work", "approval", "end"] as FlowKind[]).map(
                  (kind, i) => (
                    <div key={kind} className={`workflow-kind-${kind}`}>
                      <span className="workflow-stage-icon">
                        <WorkflowStageIcon kind={kind} size={20} />
                      </span>
                      <span>{flowLabels[kind]}</span>
                      {i < 3 && <ArrowLeft size={15} />}
                    </div>
                  ),
                )}
              </div>
              <button className={button} onClick={create} disabled={isLoading}>
                <Plus size={17} />
                ساخت اولین الگو
              </button>
              <small>
                <ShieldCheck size={13} /> الگوها تا زمان انتشار روی وظایف شما
                اثر ندارند.
              </small>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
