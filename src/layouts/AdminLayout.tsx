import { useState } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { LogOut, BookOpen, Menu, Clock, Users, BookOpen as BookOpenIcon, Speech, UserPen } from 'lucide-react';

export const AdminLayout = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { label: 'Periode', path: '/admin/periode', icon: Clock },
    { label: 'Peserta', path: '/admin/peserta', icon: Users },
    { label: 'Bacaan', path: '/admin/nilai-bacaan', icon: BookOpenIcon },
    { label: 'Penyampaian', path: '/admin/nilai-penyampaian', icon: Speech },
    { label: 'User', path: '/admin/user', icon: UserPen },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => isActive(item.path));
    return currentItem?.label || 'Dashboard';
  };

  const MobileNavItem = ({ item, onClick }: { item: typeof menuItems[0], onClick: () => void }) => {
    const Icon = item.icon;
    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
          isActive(item.path)
            ? 'bg-green-100 text-green-800 border-2 border-green-200'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Icon className={`h-5 w-5 ${isActive(item.path) ? 'text-green-600' : 'text-gray-500'}`} />
        <span className="font-medium">{item.label}</span>
        {isActive(item.path) && <Badge variant="secondary" className="ml-auto bg-green-200 text-green-800">Aktif</Badge>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="p-6 pb-4">
                    <SheetTitle className="text-left text-xl font-bold text-green-800">
                      Admin Panel
                    </SheetTitle>
                    <p className="text-sm text-left text-gray-600">Saringan PPWB</p>
                  </SheetHeader>
                  <div className="px-6 pb-6 space-y-2">
                    {menuItems.map((item) => (
                      <MobileNavItem
                        key={item.path}
                        item={item}
                        onClick={() => setMobileMenuOpen(false)}
                      />
                    ))}
                  </div>
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="text-lg font-bold text-gray-900">{getCurrentPageTitle()}</h1>
                <p className="text-xs text-gray-600">Assalamualaikum, {userProfile?.nama}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/guru')}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden md:inline">Halaman Guru</span>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden lg:block bg-white border-b">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-green-100 text-green-800 border-b-2 border-green-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="grid grid-cols-5 gap-1 p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-green-100 text-green-800'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive(item.path) ? 'text-green-600' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
