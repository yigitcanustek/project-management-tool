import Repository, { type KeyValue } from "./index.mts";
import {
  MongoClient,
  Collection,
  OptionalUnlessRequiredId,
  Filter,
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
  private key1: string;
  private key2: string;

  constructor(
    dbName: string,
    collectionName: string,
    key1: string,
    key2?: string
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
    if (key2) this.key2 = key2;
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

  create(key: K1, value: V): Promise<KeyValue<K1, V>>;
  create(key1: K1, key2: K2, value: V): Promise<KeyValue<K1, V, K2>>;
  async create(
    key1: K1,
    valueOrKey2: V | K2,
    value?: V
  ): Promise<KeyValue<K1, V> | KeyValue<K1, V, K2>> {
    if (typeof valueOrKey2 === "object" && valueOrKey2 !== null) {
      // Single key case
      const document: KeyValue<K1, V> = {
        value: valueOrKey2 as V,
      } as KeyValue<K1, V>;
      await this.collection.insertOne(
        document.value as OptionalUnlessRequiredId<V>
      );
      return document;
    } else if (value !== undefined) {
      // Composite key case
      const document: KeyValue<K1, V, K2> = {
        key: [key1, valueOrKey2 as K2] as [K1, K2], // Explicitly cast as a tuple
        value,
      } as KeyValue<K1, V, K2>;
      await this.collection.insertOne(
        document.value as OptionalUnlessRequiredId<V>
      );
      return document;
    }
    throw new Error("Invalid arguments for create method.");
  }

  async read(key1: V[K1], key2?: V[K2]): Promise<KeyValue<K1, V, K2>> {
    let query: { [x: string]: V[K1] | V[K2] } = { [this.key1]: key1 };
    if (key2 !== undefined) {
      query = { ...query, [this.key2]: key2 };
    }

    const result = await this.collection.findOne({ ...(query as Filter<V>) });
    if (!result) {
      throw new Error("Document not found.");
    }

    return {
      key: key2 !== undefined ? ([key1, key2] as [K1, K2]) : ([key1] as [K1]),
      value: result,
    } as unknown as KeyValue<K1, V, K2>;
  }
  async update(
    value: Partial<V>,
    key1: V[K1],
    key2?: V[K2]
  ): Promise<KeyValue<K1, V, K2>> {
    let query: { [x: string]: V[K1] | V[K2] } = { [this.key1]: key1 };
    if (key2 !== undefined) {
      query = { ...query, [this.key2]: key2 };
    }

    const result = await this.collection.findOneAndUpdate(
      { ...(query as Filter<V>) },
      { $set: value },
      { returnDocument: "after" }
    );

    if (!result._id) {
      throw new Error("Document not found or update failed.");
    }

    return {
      key: key2 !== undefined ? ([key1, key2] as [K1, K2]) : ([key1] as [K1]),
      value: result,
    } as unknown as KeyValue<K1, V, K2>;
  }

  async delete(
    key1: V[K1],
    key2?: K2 extends keyof V ? V[K2] : undefined
  ): Promise<boolean> {
    let query: Record<string, unknown> = { [this.key1]: key1 };
    if (key2 !== undefined) {
      query[this.key2] = key2;
    }

    const result = await this.collection.deleteOne(query as Filter<V>);
    return result.deletedCount > 0;
  }

  manyCreate(values: V[]): Promise<KeyValue<K1, V, K2>> {
    throw new Error("Method not implemented.");
  }
  manyRead<
    K1 extends keyof V,
    V extends object,
    K2 extends keyof V | undefined = undefined
  >(
    keys: (K2 extends keyof V ? { key1: K1; key2: K2 } : { key1: K1 })[]
  ): Promise<KeyValue<K1, V, K2>[]> {
    throw new Error("Method not implemented.");
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
