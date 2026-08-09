import { component$, Slot } from "@builder.io/qwik";
import type { RequestHandler } from "@builder.io/qwik-city";
import { StudentMenu } from "../components/student-menu/student-menu";

export const onGet: RequestHandler = async ({ cacheControl }) => {
  cacheControl({
    staleWhileRevalidate: 60 * 60 * 24 * 7,
    maxAge: 5,
  });
};

// `<StudentMenu />` renders BEFORE `<Slot />` so the nav is a DOM
// SIBLING of every route's own content (`<main>`), never a descendant
// (REQ-MENU-001/012) — this is why the previously-bare `<Slot />` is
// now wrapped in a fragment.
export default component$(() => {
  return (
    <>
      <StudentMenu />
      <Slot />
    </>
  );
});
