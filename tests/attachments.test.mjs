import test from "node:test";
import assert from "node:assert/strict";
import { fetchAttachment, previewContentType, supportsPreview } from "../src/lib/attachments.ts";

const file = { id: "file-1", name: "report.pdf", size: 5, createdAt: "2026-11-14T00:00:00Z" };

test("attachment download uses authentication and reports missing or forbidden files", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "/api/files/file-1");
      assert.equal(options.headers.authorization, "Bearer test-token");
      return new Response("content", { status: 200 });
    };
    assert.equal(await (await fetchAttachment(file, "test-token")).text(), "content");
    globalThis.fetch = async () => new Response(null, { status: 403 });
    await assert.rejects(fetchAttachment(file, "test-token"), /اجازه/);
    globalThis.fetch = async () => new Response(null, { status: 404 });
    await assert.rejects(fetchAttachment(file, "test-token"), /پیدا نشد/);
  } finally { globalThis.fetch = originalFetch; }
});

test("preview accepts supported matching file signatures and rejects active or disguised files", async () => {
  assert.equal(await previewContentType("report.PDF", new Blob(["%PDF-1.7"])), "application/pdf");
  assert.equal(await previewContentType("photo.png", new Blob([new Uint8Array([137,80,78,71,13,10,26,10])])), "image/png");
  assert.equal(await previewContentType("fake.pdf", new Blob(["<script>"])), null);
  assert.equal(await previewContentType("photo.svg", new Blob(["<svg></svg>"])), null);
  assert.equal(supportsPreview("report.PDF"), true);
  assert.equal(supportsPreview("document.docx"), false);
});
