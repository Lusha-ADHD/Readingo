export function sitePath(pathname = "/") {
  const base = `${import.meta.env.BASE_URL.replace(/\/+$/, "")}/`;

  if (pathname === "/") {
    return base;
  }

  return `${base}${pathname.replace(/^\/+/, "")}`;
}
