import { serve } from "bun";
import { Workflow, CanvasComponent } from "./src/Index/Workflow/workflow.ts";
import { MongoAdapter } from "../libs/repository/MongoAdapter.ts";

const workflowDb = new MongoAdapter<"_id", CanvasComponent>(
  "IssueTracker",
  "Workflow",
  "_id"
);
const workflow = new Workflow(workflowDb);

const server = serve({
  port: 8080,
  fetch(req) {
    const url = new URL(req.url);
    const workflowResponse = workflow.getRouter(req);

    if (workflowResponse) {
      return workflowResponse;
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Bun server is running on http://localhost:${server.port}`);
