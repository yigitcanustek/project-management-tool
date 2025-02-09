import { MongoAdapter } from "./MongoAdapter.ts";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

type Test = { _id: string; name: string };

const adapter = new MongoAdapter<"_id", Test>(
  "ProjectManagement",
  "Workflow",
  "_id"
);

describe("MongoAdapter", () => {
  it("should insert a document successfully", async () => {
    const testData: Test = { _id: "1", name: "Test User" };
    const result = await adapter.create("_id", testData);

    expect(result).toHaveProperty("value");
    expect(result.value).toEqual(testData);
  });

  it("should read a document by ID", async () => {
    const result = await adapter.read("1");
    console.log(result);
    expect(result).toHaveProperty("value");
    expect(result.value.name).toBe("Test User");
  });

  it("should update a document", async () => {
    const updatedData = { name: "Updated User" };
    const result = await adapter.update(updatedData, "1");

    expect(result.value.name).toBe("Updated User");
  });

  it("should delete a document", async () => {
    const deleteResult = await adapter.delete("1");
    expect(deleteResult).toBe(true);

    // Ensure document is actually deleted
    await expect(adapter.read("1")).rejects.toThrow("Document not found.");
  });
});
