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

  async list() {
    return await this.workflowDb.manyRead();
  }

  async update(workflowComponents: CanvasComponent[]) {
    for (const component of workflowComponents) {
      await this.workflowDb.update(component);
    }
  }

  async delete(workflowComponentsIdList: { _id: string }[]): Promise<void> {
    for (const { _id } of workflowComponentsIdList) {
      await this.workflowDb.delete(_id);
    }
  }

  async getRouter(req: Request) {
    const url = new URL(req.url);

    switch (url.pathname) {
      case "/workflow": {
        switch (req.method) {
          case "GET": {
            const res = await this.list();
            const list = res.map((_res) => _res.value);
            return new Response(JSON.stringify(list));
          }

          case "POST": {
            await this.create(await req.json());
            return new Response("Ok", { status: 200 });
          }

          case "PUT":
            await this.update(await req.json());
            return new Response("Received a PUT request!", { status: 200 });

          case "DELETE": {
            const res = await req.json();
            console.log(res);
            await this.delete(res);
            return new Response("Received a DELETE request!", { status: 200 });
          }
          default:
            return new Response("Method Not Allowed", { status: 405 });
        }
      }
    }
  }
}
