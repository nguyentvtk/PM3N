import * as React from 'react';
import { cn } from '@/lib/utils';

const Tabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string; value?: string; onValueChange?: (v: string) => void }
>(({ className, defaultValue, value, onValueChange, children, ...props }, ref) => {
  const [active, setActive] = React.useState(value ?? defaultValue ?? '');

  React.useEffect(() => {
    if (value !== undefined) setActive(value);
  }, [value]);

  const handleChange = (v: string) => {
    setActive(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ active, setActive: handleChange }}>
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});
Tabs.displayName = 'Tabs';

const TabsContext = React.createContext<{ active: string; setActive: (v: string) => void }>({
  active: '',
  setActive: () => {},
});

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex w-full items-center justify-center rounded-lg bg-[#0f172a] p-1 border border-white/10',
        className
      )}
      {...props}
    />
  )
);
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
  const { active, setActive } = React.useContext(TabsContext);
  const isActive = active === value;
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setActive(value)}
      className={cn(
        'flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow'
          : 'text-slate-400 hover:text-slate-200',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, children, ...props }, ref) => {
  const { active } = React.useContext(TabsContext);
  if (active !== value) return null;
  return (
    <div ref={ref} className={cn('mt-4 animate-fade-in', className)} {...props}>
      {children}
    </div>
  );
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
