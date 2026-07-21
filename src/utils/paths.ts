export function sitePath(pathname = "/") {
  const base = import.meta.env.BASE_URL;

  if (pathname === "/") {
    return base;
  }

  return `${base}${pathname.replace(/^\//, "")}`;
}
