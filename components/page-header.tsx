import { ReactNode } from "react";

export function PageHeader({
  title,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="-mx-4 -mt-5 mb-5 flex min-h-16 flex-col justify-center gap-3 border-b px-4 py-3 md:-mx-5 md:flex-row md:items-center md:justify-between md:px-5 lg:-mx-6 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-foreground">{title}</h1>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
