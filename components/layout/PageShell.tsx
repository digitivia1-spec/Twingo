import { Topbar } from './Topbar';

export function PageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Topbar title={title} />
      <div className="page-enter flex-1 overflow-y-auto p-5 space-y-5">
        {children}
      </div>
    </>
  );
}
