import AdminSidebar from '@/components/AdminSidebar'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex h-screen bg-white">
        <AdminSidebar />
        {/* Desktop Layout */}
        <div className="hidden lg:flex flex-1 ml-96 overflow-auto">
          <main className="p-8 w-full">
            {children}
          </main>
        </div>
        
        {/* Mobile Layout */}
        <div className="lg:hidden flex-1 overflow-auto">
          <main className="p-4 pt-20 w-full">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}