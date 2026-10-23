import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  api,
  signedIn,
  useContextsQuery,
  useMutateMutation,
  errorText,
} from "../store";
import {
  Card,
  Field,
  input,
  button,
  Loading,
  ErrorBox,
} from "../components/ui";
import OrganizationTreeSelect from "../components/OrganizationTreeSelect";
import Brand from "../components/Brand";
export default function ContextSelect() {
  const { data, error } = useContextsQuery();
  const [mutate, { isLoading }] = useMutateMutation();
  const [selected, setSelected] = useState("");
  const [company, setCompany] = useState("");
  const [step, setStep] = useState(2);
  const [message, setMessage] = useState("");
  const dispatch = useDispatch(),
    navigate = useNavigate();
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!data) return <Loading />;
  if (!data.roles.length) return <ErrorBox message="نقشی برای این حساب تعریف نشده است؛ با مدیر سامانه تماس بگیرید." />;
  const role =
    data.roles.find((r: any) => (r.id || "legacy") === selected) ||
    data.roles[0];
  return (
    <div className="mx-auto max-w-lg py-14">
      <Card>
        <Brand large />
        <p className="my-6 text-xs text-brand">
          مرحله {step === 2 ? "دوم" : "سوم"} از سه
        </p>
        <h1 className="mb-6 text-xl font-bold">
          {step === 2 ? "نقش فعال را انتخاب کنید" : "شرکت / سازمان فعال"}
        </h1>
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setMessage("");
            if (step === 2) {
              setStep(3);
              return;
            }
            try {
              const result = await mutate({
                url: "auth/context",
                body: {
                  roleId: role.id,
                  company: company || role.companies[0],
                },
              }).unwrap();
              dispatch(api.util.resetApiState());
              dispatch(signedIn(result));
              navigate("/", { replace: true });
            } catch (err) {
              setMessage(errorText(err));
            }
          }}
        >
          <p className="text-xs leading-6 text-slate-500">
            فقط نقش‌ها و شرکت‌هایی که مدیر سامانه برای حساب شما تعیین کرده نمایش داده می‌شوند.
          </p>
          {step === 2 ? (
            <Field label="نقش‌های مجاز این حساب">
              <select
                className={input}
                value={role.id || "legacy"}
                onChange={(e) => {
                  setSelected(e.target.value);
                  setCompany("");
                }}
              >
                {data.roles.map((r: any) => (
                  <option key={r.id || "legacy"} value={r.id || "legacy"}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <OrganizationTreeSelect
              key={role.id || "legacy"}
              label="شرکت / سازمان"
              name="company"
              disabled={isLoading}
              valueKey="id"
              value={(company || role.companies[0]) === "*" ? "all-companies" : role.companyTree?.find((node: any) => node.name === (company || role.companies[0]))?.id || ""}
              onChange={(id) => setCompany(id === "all-companies" ? "*" : role.companyTree.find((node: any) => node.id === id)?.name || "")}
              nodes={[
                ...(role.companies.includes("*")
                  ? [{ id: "all-companies", name: "کل گروه / همه شرکت‌ها", type: "گروه", parentId: null }]
                  : []),
                ...(role.companyTree || []).map((node: any) => ({
                  ...node,
                  parentId: node.parentId || (role.companies.includes("*") ? "all-companies" : null),
                })),
              ]}
              allowedIds={[
                ...(role.companies.includes("*") ? ["all-companies"] : []),
                ...(role.companyTree || [])
                  .filter((node: any) => role.companies.includes(node.name) && ["شرکت مادر", "شرکت تابعه"].includes(node.type))
                  .map((node: any) => node.id),
              ]}
            />
          )}
          {!role.companies.length && (
            <ErrorBox message="شرکتی برای این نقش تعریف نشده؛ با مدیر سامانه تماس بگیرید." />
          )}
          {message && <ErrorBox message={message} />}
          <button
            disabled={isLoading || (step === 3 && !role.companies.length)}
            className={button + " w-full"}
          >
            {step === 2 ? "ادامه و انتخاب سازمان" : "ورود به سامانه"}
          </button>
          {step === 3 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-sm text-brand"
            >
              بازگشت به انتخاب نقش
            </button>
          )}
        </form>
      </Card>
    </div>
  );
}
