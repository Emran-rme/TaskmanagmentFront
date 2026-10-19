import OrganizationUnitEditor from "./OrganizationUnitEditor";

import { useSelector } from "react-redux";
import { RootState, can, manages } from "../store";
import { Workspace } from "../lib/types";

export default function DepartmentManager({
  workspace: w,
}: {
  workspace: Workspace;
}) {
  const actor = useSelector((s: RootState) => s.auth.user);
  const units = w.organization || [];
  function owner(id: string) {
    let u = units.find((x) => x.id === id);
    const seen = new Set<string>();
    while (u && !seen.has(u.id)) {
      seen.add(u.id);
      if (["شرکت مادر", "شرکت تابعه"].includes(u.type)) return u.name;
      const parent = u.parentId;
      u = units.find((x) => x.id === parent);
    }
    return "";
  }
  const allowed = (id: string) =>
    actor?.role === "Admin" ||
    (manages(actor, owner(id)) && can(actor, "organization.write", owner(id)));
  if (
    actor?.role !== "Admin" &&
    !w.companies.some(
      (c) => manages(actor, c) && can(actor, "organization.write", c),
    )
  )
    return null;
  return (
    <OrganizationUnitEditor
      units={units}
      endpoint="organization/units"
      allowed={allowed}
      admin={actor?.role === "Admin"}
    />
  );
}
