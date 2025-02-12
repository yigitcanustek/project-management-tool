import Repository, { type KeyValue } from "./index.mts";
import {
  ObjectId,
  MongoClient,
  Collection,
  OptionalUnlessRequiredId,
  Filter,
  WithId,
  MatchKeysAndValues,
} from "mongodb";

import assert from "assert";

export class MongoAdapter<
  K1 extends keyof V,
  V extends object,
  K2 extends keyof V | undefined = undefined
> implements Repository<K1, V, K2>
{
  private client: MongoClient;
  private collection: Collection<V>;
  private key1: keyof V;
  private key2?: keyof V;

  constructor(
    dbName: string,
    collectionName: string,
    key1: keyof V,
    key2?: keyof V
  ) {
    const DB_URI = process.env.DB_URI;
    const DB_USERNAME = process.env.DB_USERNAME;
    const DB_PASSWORD = process.env.DB_PASSWORD;
    assert(DB_URI, "MongoDB URI not found!");
    assert(DB_USERNAME, "MongoDB username not found!");
    assert(DB_PASSWORD, "MongoDB password not found!");

    const mongoUri = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_URI}/?authSource=admin`;

    this.client = new MongoClient(mongoUri);
    this.collection = this.client.db(dbName).collection<V>(collectionName);
    this.key1 = key1;
    this.key2 = key2;

    this.client.connect().then((conn) => {
      conn.on("connectionCreated", () => {
        console.log(`DB connected on ${DB_URI}:27017`);
      });
    });
  }

  close() {
    this.client.once("connectionClosed", () => {
      console.log("Connection closed! If you want, you can re-connect.");
    });
    this.client.close();
  }

  // Overloaded method signatures
  create(value: V): Promise<KeyValue<"_id" & keyof V, V>>;
  create(key: K1, value: V): Promise<KeyValue<K1, V>>;
  create(key1: K1, key2: K2, value: V): Promise<KeyValue<K1, V, K2>>;

  async create(
    key1OrValue: K1 | V,
    key2OrValue?: K2 | V,
    maybeValue?: V
  ): Promise<
    KeyValue<K1, V> | KeyValue<K1, V, K2> | KeyValue<"_id" & keyof V, V>
  > {
    if (typeof key1OrValue === "object" && key1OrValue !== null) {
      // No key provided, auto-generate _id
      const document = {
        key: ["_id"] as ["_id"],
        value: { _id: new ObjectId().toHexString(), ...key1OrValue },
      } as KeyValue<"_id" & keyof V, V>;

      await this.collection.insertOne(
        document.value as OptionalUnlessRequiredId<V>
      );
      return document;
    }

    if (typeof key2OrValue === "object" && key2OrValue !== null) {
      // Single key case
      const document = {
        key: [key1OrValue as K1],
        value: key2OrValue as V,
      } as KeyValue<K1, V>;

      await this.collection.insertOne(
        document.value as OptionalUnlessRequiredId<V>
      );
      return document;
    }

    if (maybeValue !== undefined) {
      // Composite key case
      const document = {
        key: [key1OrValue as K1, key2OrValue as K2] as [K1, K2],
        value: maybeValue,
      } as KeyValue<K1, V, K2>;

      await this.collection.insertOne(
        document.value as OptionalUnlessRequiredId<V>
      );
      return document;
    }

    throw new Error("Invalid arguments for create method.");
  }

  async read(key1: V[K1], key2?: V[K2]): Promise<KeyValue<K1, V, K2> | null> {
    let query: Record<string, unknown> = { [this.key1 as string]: key1 };

    if (key2 !== undefined && this.key2) {
      query[this.key2 as string] = key2;
    }

    const result = await this.collection.findOne(query as Filter<V>);
    if (!result) return null;

    return {
      key:
        key2 !== undefined
          ? ([key1, key2] as [V[K1], V[K2]])
          : ([key1] as [V[K1]]),
      value: result as V,
    } as KeyValue<K1, V, K2>;
  }

  async update(
    value: Partial<V>,
    key1?: V[K1],
    key2?: V[K2]
  ): Promise<KeyValue<K1, V, K2>> {
    // Ensure `_id` is omitted to avoid immutable field error
    const { _id, ...updatedData } = value as Partial<V & { _id: string }>;

    let query: Record<string, unknown> = {};
    if (_id) {
      query["_id"] = _id;
    } else {
      query["_id"] = new ObjectId().toHexString();
    }

    const result = await this.collection.findOneAndUpdate(
      query as Filter<V>,
      { $set: updatedData as MatchKeysAndValues<V> },
      { upsert: true, returnDocument: "after" }
    );

    if (!result) {
      throw new Error("Document not found or update failed.");
    }

    const key =
      key1 !== undefined
        ? key2 !== undefined && this.key2
          ? ([key1, key2] as [V[K1], V[K2]])
          : ([key1] as [V[K1]])
        : ([] as []);

    return {
      key,
      value: result as V,
    } as KeyValue<K1, V, K2>;
  }

  async delete(key1: V[K1], key2?: V[K2]): Promise<boolean> {
    let query: Record<string, unknown> = { [this.key1 as string]: key1 };

    if (key2 !== undefined && this.key2) {
      query[this.key2 as string] = key2;
    }

    const result = await this.collection.deleteOne(query as Filter<V>);
    return result.deletedCount > 0;
  }

  manyCreate(values: V[]): Promise<KeyValue<K1, V, K2>> {
    throw new Error("Method not implemented.");
  }

  async manyRead(): Promise<KeyValue<K1, V, K2>[]>; // No keys provided, return all documents
  async manyRead(
    keys?: (K2 extends keyof V
      ? { key1: V[K1]; key2: V[K2] }
      : { key1: V[K1] })[]
  ): Promise<KeyValue<K1, V, K2>[]> {
    let query: Filter<V> = {};

    if (keys && keys.length > 0) {
      query = {
        $or: keys.map((entry) => {
          const condition: Record<string, unknown> = {
            [this.key1 as string]: entry.key1,
          };
          if (this.key2 && "key2" in entry) {
            condition[this.key2 as string] = (
              entry as { key1: V[K1]; key2: V[K2] }
            ).key2;
          }
          return condition;
        }),
      };
    }

    const results = await this.collection.find(query).toArray();

    return results.map((result) => {
      // Explicitly assert `result` as `V`
      const data = result as unknown as V;

      const key1Value = data[this.key1] as V[K1];
      const key2Value = this.key2 ? (data[this.key2] as V[K2]) : undefined;

      const key =
        this.key2 && key2Value !== undefined
          ? ([key1Value, key2Value] as [V[K1], V[K2]])
          : ([key1Value] as [V[K1]]);

      return {
        key,
        value: data,
      } as KeyValue<K1, V, K2>;
    });
  }

  manyUpdate(values: Partial<V>[]): Promise<KeyValue<K1, V, K2>> {
    throw new Error("Method not implemented.");
  }
  manyDeleted<
    K1 extends keyof V,
    V extends object,
    K2 extends keyof V | undefined = undefined
  >(
    keys: (K2 extends keyof V ? { key1: K1; key2: K2 } : { key1: K1 })[]
  ): Promise<boolean[]> {
    throw new Error("Method not implemented.");
  }
}
