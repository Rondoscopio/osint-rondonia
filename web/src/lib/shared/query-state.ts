export type QueryState<T> = {
  data: T | undefined;
  isError: boolean;
  isPending: boolean;
  isFetching: boolean;
  refetch: () => Promise<unknown>;
};
