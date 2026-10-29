import { useRef, type KeyboardEvent } from 'react';
import { ROLES } from '@/config/roles';
import type { Role } from '@/types/auth';
import { cx } from '@/utils/cx';

interface RoleTabsProps {
  activeRole: Role;
  onChange: (role: Role) => void;
}

export function RoleTabs({ activeRole, onChange }: RoleTabsProps) {
  const activeIndex = Math.max(
    0,
    ROLES.findIndex((role) => role.id === activeRole),
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    let nextIndex = activeIndex;
    if (event.key === 'ArrowRight') {
      nextIndex = (activeIndex + 1) % ROLES.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (activeIndex - 1 + ROLES.length) % ROLES.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = ROLES.length - 1;
    }

    onChange(ROLES[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Giriş türü seçimi"
      className="relative grid grid-cols-3 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-1.5 dark:border-white/[0.08] dark:bg-white/[0.04]"
    >
      <span
        aria-hidden
        className="absolute inset-y-1.5 left-1.5 w-[calc((100%_-_0.75rem)/3)] rounded-xl bg-[linear-gradient(135deg,#7c5cff,#5f6bff)] shadow-[0_10px_24px_-12px_rgba(124,92,255,0.9)] transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${activeIndex * 100}%)` }}
      />
      {ROLES.map((role, index) => {
        const isActive = role.id === activeRole;

        return (
          <button
            key={role.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={role.label}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(role.id)}
            onKeyDown={handleKeyDown}
            className={cx(
              'relative z-10 flex items-center justify-center whitespace-nowrap rounded-xl px-1 py-2.5 text-[10.5px] font-semibold transition-colors duration-300 sm:px-2 sm:text-[12px] lg:text-[10.5px] xl:text-[12px]',
              isActive
                ? 'text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            <span className="sm:hidden">{role.tabLabel}</span>
            <span className="hidden sm:inline">{role.label}</span>
          </button>
        );
      })}
    </div>
  );
}
