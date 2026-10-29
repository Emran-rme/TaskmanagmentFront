import test from "node:test";
import assert from "node:assert/strict";
import {canCloseTask,canEditTask,canProject,canManageProject} from "../src/lib/access.ts";
const task={id:"task",projectId:"project",company:"C",assigneeId:1,assigneeIds:[1],approverId:2};
const workspace={projects:[{id:"project",managerId:3,company:"C"}],projectPermissions:{project:["tasks.read","tasks.write","projects.write"]}};
const user=(id,role="Member")=>({id,role,enabled:true,permissions:["tasks.read","tasks.write","projects.write"],companyPermissions:{C:["tasks.read","tasks.write","projects.write"]},managedCompanies:role==="Manager"?["C"]:[]});
test("non-admin assignee cannot approve another owner's task; Admin is exempt",()=>{
 for(const role of ["Manager","Member"]){assert.equal(canEditTask(user(1,role),task,workspace),true);assert.equal(canCloseTask(user(1,role),task,workspace),false);}
 assert.equal(canCloseTask(user(1,"Admin"),task,workspace),true);
 assert.equal(canCloseTask(user(2),task,workspace),true);
});
test("supervisors remain scoped to their own tasks, including standalone tasks",()=>{
 assert.equal(canCloseTask(user(3,"Manager"),task,workspace),false);
 assert.equal(canEditTask(user(4,"Manager"),{...task,projectId:null},workspace),false);
 assert.equal(canCloseTask(user(2,"Manager"),{...task,projectId:null},workspace),true);
 assert.equal(canCloseTask(user(2,"Manager"),{...task,approverId:3},workspace),false);
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
