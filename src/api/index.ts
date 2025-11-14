const BASE_URL = "https://localhost:4545/api/v1";

export const GET = async <T>(url: string): Promise<T[]> => {
  const res = await fetch(BASE_URL + "/" + url);
  return (await res.json()) as T[];
};
