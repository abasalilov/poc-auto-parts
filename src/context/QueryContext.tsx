"use client";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useCallback,
  useMemo,
  useState,
} from "react";

interface QueryContext {
  search: string;
  setSearch: (q: string) => void;
  committedSearch: string;
  commitSearch: (q: string) => void;
}

// Create Context Object
export const QueryContext = createContext<QueryContext>({} as QueryContext);

// Create a provider for components to consume and subscribe to changes
export default function QueryContextProvider(props: PropsWithChildren) {
  const [search, setSearch] = useState<string>("");
  const [committedSearch, setCommittedSearch] = useState<string>("");

  const commitSearch = useCallback((q: string) => {
    const nextSearch = q.trim();
    setSearch(nextSearch);
    setCommittedSearch(nextSearch);
  }, []);

  const value = useMemo(
    () => ({
      search,
      setSearch,
      committedSearch,
      commitSearch,
    }),
    [search, setSearch, committedSearch, commitSearch],
  );

  return (
    <QueryContext.Provider value={value}>
      {props.children}
    </QueryContext.Provider>
  );
}

export const useQuery = () => useContext(QueryContext);
