import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import fs from "node:fs";
import ts from "typescript";

test("workflow identifiers work in HTTP contexts without crypto.randomUUID", () => {
  const source=fs.readFileSync(new URL("../src/lib/uuid.ts",import.meta.url),"utf8");
  const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const context={exports:{},crypto:{getRandomValues:array=>webcrypto.getRandomValues(array)}};
  vm.runInNewContext(js,context);
  const ids=Array.from({length:100},()=>context.exports.randomUuid());
  assert.equal(new Set(ids).size,100);
  for(const id of ids)assert.match(id,/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
});
