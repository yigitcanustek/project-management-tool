export type KeyValue<
  K1 extends keyof V,
  V extends object,
  K2 extends keyof V | undefined = undefined
> = K2 extends keyof V
  ? { key: [V[K1], V[K2]]; value: V } // Composite key if K2 is defined
  : { key: [V[K1]]; value: V }; // Single key if K2 is undefined

export default interface Repository<
  K1 extends keyof V,
  V extends object,
  K2 extends keyof V | undefined = undefined
> {
  /*
    atomic(CREATE | READ | UPDATE | DELETE)
  These are atomic and sequential operation which is not 
    create workload on the system */
  create(value: V): Promise<KeyValue<"_id" & keyof V, V>>;
  create(key1: K1, value: V): Promise<KeyValue<K1, V>>;
  create(key1: K1, key2: K2, value: V): Promise<KeyValue<K1, V, K2>>;

  create(
    key1OrValue?: K1 | V,
    key2OrValue?: K2 | V,
    maybeValue?: V
  ): Promise<KeyValue<K1 | ("_id" & keyof V), V, K2 | undefined>>;

  read(key1: V[K1], key2?: V[K2]): Promise<KeyValue<K1, V, K2> | null>;
  update(
    value: Partial<V>,
    key1?: V[K1],
    key2?: K2 extends keyof V ? V[K2] : undefined
  ): Promise<KeyValue<K1, V, K2>>;
  delete(
    key1: V[K1],
    key2?: K2 extends keyof V ? V[K2] : undefined
  ): Promise<boolean>;

  /* many(CREATE | READ | UPDATE | DELETE)
    These are sequantial but may cause workload on the system
  */

  manyCreate(values: V[]): Promise<KeyValue<K1, V, K2>>;
  manyRead(): Promise<KeyValue<K1, V, K2>[]>; // No keys provided, return all documents

  manyRead(
    keys: (K2 extends keyof V
      ? { key1: V[K1]; key2: V[K2] }
      : { key1: V[K1] })[]
  ): Promise<KeyValue<K1, V, K2>[]>; // Keys provided, return filtered documents

  manyUpdate(values: Partial<V>[]): Promise<KeyValue<K1, V, K2>>;
  manyDeleted<
    K1 extends keyof V,
    V extends object,
    K2 extends keyof V | undefined = undefined
  >(
    keys: (K2 extends keyof V ? { key1: K1; key2: K2 } : { key1: K1 })[]
  ): Promise<boolean[]>;
}
