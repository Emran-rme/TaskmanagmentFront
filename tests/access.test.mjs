import test from "node:test";
import assert from "node:assert/strict";
import {canCloseTask,canEditTask,canProject,canManageProject} from "../src/lib/access.ts";
const task={id:"task",projectId:"project",company:"C",assigneeId:1,assigneeIds:[1],approverId:2};
const workspace={projects:[{id:"project",managerId:3,company:"C"}],projectPermissions:{project:["tasks.read","tasks.write","projects.write"]}};
const user=(id,role="Member")=>({id,role,enabled:true,permissions:["tasks.read","tasks.write","projects.write"],companyPermissions:{C:["tasks.read","tasks.write","projects.write"]},managedCompanies:role==="Manager"?["C"]:[]});
test("assignee cannot approve another owner's task, including Admin",()=>{
 for(const role of ["Admin","Manager","Member"]){assert.equal(canEditTask(user(1,role),task,workspace),true);assert.equal(canCloseTask(user(1,role),task,workspace),false);}
 assert.equal(canCloseTask(user(2),task,workspace),true);
});
test("project grants and actual project ownership control buttons",()=>{
 assert.equal(canEditTask(user(4,"Manager"),task,workspace),false);
 assert.equal(canEditTask(user(3),task,workspace),true);
 assert.equal(canCloseTask(user(3),task,workspace),false);
 assert.equal(canManageProject(user(4,"Manager"),workspace.projects[0],workspace),false);
 assert.equal(canManageProject(user(3),workspace.projects[0],workspace),true);
 const readOnly={...workspace,projectPermissions:{project:["tasks.read"]}};
 assert.equal(canEditTask(user(1),task,readOnly),false);
 assert.equal(canCloseTask(user(2),task,readOnly),false);
 assert.equal(canProject(user(1),"tasks.write","C","project",{...workspace,projectPermissions:{}}),false);
});
