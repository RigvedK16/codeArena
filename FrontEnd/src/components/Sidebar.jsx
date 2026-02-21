import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const { pathname } = useLocation();
  const itemClass = (path) => `btn btn-ghost justify-start ${pathname === path ? 'text-emerald-600 font-semibold' : 'text-black'}`;
  return (
    <aside className="w-64 shrink-0 border-r bg-white">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2">Menu</h2>
        <nav className="flex flex-col gap-2">
          <Link to="/dashboard" className={itemClass('/dashboard')}>Dashboard</Link>
          <Link to="/my-groups" className={itemClass('/my-groups')}>My Groups</Link>
        </nav>
      </div>
    </aside>
  );
}
