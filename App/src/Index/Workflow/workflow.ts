import Repository from "repository";

type MongoComponent = BaseComponent & { _id: string };

interface BaseComponent {
  componentType: "Rectangle" | "Line" | "Connection";
  id: number;
}

interface LineComponent extends MongoComponent {
  componentType: "Line";
  lineAttr: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
}

interface RectangleComponent extends MongoComponent {
  componentType: "Rectangle";
  rectangleAttr: {
    label?: string;
    backgroundColor: string;
    width: number;
    height: number;
    start: { x: number; y: number };
  };
}
interface ConnectionComponent extends MongoComponent {
  componentType: "Connection";
  connectionAttr: {
    start: {
      rectangleId: number;
      rectanglePointLocation: {
        x: number;
        y: number;
      };
    };
    end?: {
      rectangleId: number;
      rectanglePointLocation: {
        x: number;
        y: number;
      };
    };
  };
}

export type CanvasComponent =
  | RectangleComponent
  | LineComponent
  | ConnectionComponent;

export class Workflow {
  constructor(
    private readonly workflowDb: Repository<"_id", CanvasComponent>
  ) {}

  async create(workflowComponents: CanvasComponent[]) {
    for (const component of workflowComponents) {
      await this.workflowDb.create(component);
    }
  }

  getRouter(req: Request) {
    const url = new URL(req.url);

    switch (url.pathname) {
      case "/workflow/": {
        switch (req.method) {
          case "GET":
            return new Response("Hello, Bun.js!");

          case "POST":
            return new Response("Received a POST request!", { status: 201 });

          case "PUT":
            return new Response("Received a PUT request!", { status: 200 });

          case "DELETE":
            return new Response("Received a DELETE request!", { status: 200 });

          default:
            return new Response("Method Not Allowed", { status: 405 });
        }
      }
    }
  }
}
