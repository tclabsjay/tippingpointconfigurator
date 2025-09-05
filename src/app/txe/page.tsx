export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function Page() {
  return new Response(null, {
    status: 308,
    headers: {
      Location: "/tpc",
    },
  }) as unknown as JSX.Element;
}


