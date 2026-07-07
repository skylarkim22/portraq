import { Sidebar } from "@/components/Sidebar";

const AppLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <>
      <Sidebar />
      <main className="md:ml-60">{children}</main>
    </>
  );
};

export default AppLayout;
