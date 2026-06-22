interface HeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function Header({ title, description, action }: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
