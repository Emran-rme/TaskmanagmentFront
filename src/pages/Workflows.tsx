import { useState } from "react";
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
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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
      <div className="flex justify-between items-center">
        <h1>طراح گردش‌کار</h1>
        <button className={button} onClick={create} disabled={isLoading}>
          الگوی جدید
        </button>
      </div>
      {!catalog.enabled && (
        <ErrorBox message="موتور گردش‌کار در تنظیمات سرور غیرفعال است؛ الگوها اجرا نمی‌شوند." />
      )}
      <p className="text-sm leading-7">
        نسخه فعال به تسک‌های جدید تخصیص می‌یابد. تسک‌های قبلی با نسخه خود ادامه
        می‌دهند. برای بازگشت، نسخه منتشرشده قبلی را فعال کنید یا الگو را غیرفعال
        کنید.
      </p>
      {dirty && (
        <p role="status">
          تغییرات ذخیره‌نشده دارید؛ قبل از تعویض الگو آن‌ها را ذخیره کنید.
        </p>
      )}
      {message && <ErrorBox message={message} />}
      <div className="workflow-layout">
        <Card>
          <h2>الگوها و نسخه‌ها</h2>
          <div className="workflow-version-list">
            {catalog.definitions.map((d) => (
              <button
                disabled={dirty || isLoading}
                className={`${secondary} ${definition?.id === d.id ? "workflow-active-version" : ""}`}
                key={d.id}
                onClick={() => open(d)}
              >
                <strong>{d.name}</strong>
                <span>
                  {d.company} ·{" "}
                  {d.projectId
                    ? workspace.projects.find((p) => p.id === d.projectId)
                        ?.name || "پروژه"
                    : "پیش‌فرض شرکت"}
                </span>
                <span>
                  {d.published ? `نسخه ${d.version}` : "پیش‌نویس"}{" "}
                  {d.active ? " · فعال" : ""}
                </span>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          {definition ? (
            <>
              <div className="workflow-toolbar">
                <button
                  className={secondary}
                  onClick={clone}
                  disabled={isLoading}
                >
                  کپی به پیش‌نویس جدید
                </button>
                {!readonly && (
                  <button
                    className={button}
                    disabled={isLoading || !dirty}
                    onClick={save}
                  >
                    ذخیره پیش‌نویس
                  </button>
                )}
                <button
                  className={button}
                  disabled={isLoading || dirty}
                  onClick={() => setPending(definition)}
                >
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
              <div className="grid gap-3 md:grid-cols-3">
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
                <div className="workflow-toolbar">
                  {(Object.keys(flowLabels) as FlowKind[]).map((kind) => (
                    <button
                      className={secondary}
                      key={kind}
                      onClick={() => {
                        const n = {
                          id: crypto.randomUUID(),
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
                      + {flowLabels[kind]}
                    </button>
                  ))}
                </div>
              )}
              <WorkflowCanvas
                graph={graph}
                editable={!readonly}
                onSelect={setSelected}
                onConnect={(c) => {
                  if (!c.source || !c.target) return;
                  setGraph((g) => ({
                    ...g,
                    edges: [
                      ...g.edges,
                      {
                        id: crypto.randomUUID(),
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
              {node && !readonly && (
                <div className="workflow-properties">
                  <h3>تنظیمات: {flowLabels[node.kind]}</h3>
                  <Field label="عنوان گره">
                    <input
                      className={input}
                      value={node.label}
                      maxLength={150}
                      onChange={(e) => updateNode({ label: e.target.value })}
                    />
                  </Field>
                  {node.kind === "assign" && (
                    <p>
                      این گره از انجام‌دهنده و ناظر انتخاب‌شده هنگام ثبت وظیفه
                      استفاده می‌کند.
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
                          {["درون‌برنامه‌ای", "ایمیل", "پیامک"].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
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
                          <option value="progress">درصد پیشرفت حداقل</option>
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
                </div>
              )}
              <p className="text-sm">
                اتصال‌ها را با کشیدن خروجی هر گره به ورودی گره بعد بسازید. برای
                حذف، گره یا اتصال را انتخاب و Delete را بزنید. هر خروجی باید یک
                اتصال داشته باشد. مسیر بستن باید از تأیید ناظر عبور کند.
              </p>
            </>
          ) : (
            <p>یک الگو انتخاب کنید یا الگوی جدید بسازید.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
