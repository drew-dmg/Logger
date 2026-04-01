import { format } from 'date-fns';

interface PagePlaceholderProps {
  title: string;
  description: string;
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <section className="mx-auto max-w-4xl">
      <p className="text-xs uppercase tracking-[0.24em] text-muted">{format(new Date(), 'EEEE, MMMM d')}</p>
      <h2 className="mt-3 text-4xl font-semibold text-text">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>

      <div className="mt-8 rounded-xl border border-edge bg-panel p-6">
        <p className="text-sm text-muted">Dashboard widgets and insights for {title.toLowerCase()} will appear here.</p>
      </div>
    </section>
  );
}
