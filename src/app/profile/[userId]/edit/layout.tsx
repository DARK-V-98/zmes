
// This function is required for static exports with dynamic routes.
// We return an empty array because we don't want to pre-render any pages at build time.
// The edit page will be rendered dynamically on the client side.
export async function generateStaticParams() {
  return [];
}

export default function EditProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
