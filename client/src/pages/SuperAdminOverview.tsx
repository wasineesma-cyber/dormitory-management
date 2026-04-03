import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShieldAlert, Users, Building2 } from "lucide-react";
import { Redirect } from "wouter";

export default function SuperAdminOverview() {
    const { user, loading } = useAuth();
    const statsQuery = trpc.superadmin.stats.useQuery(undefined, {
        enabled: user?.role === "superadmin",
    });

    if (loading || statsQuery.isLoading) return null;
    if (!user || user.role !== "superadmin") {
        return <Redirect to="/dashboard" />;
    }

    const { housesCount, usersCount, houses } = statsQuery.data || { housesCount: 0, usersCount: 0, houses: [] };

    return (
        <DashboardLayout>
            <div className="max-w-5xl">
                <div className="mb-8 flex items-center gap-4">
                    <ShieldAlert className="w-10 h-10 text-red-600" />
                    <div>
                        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">— Super Admin</div>
                        <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mt-1 text-red-600">SYSTEM DASHBOARD</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="border-4 border-black p-6 bg-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="w-6 h-6" />
                            <h2 className="text-xl font-bold uppercase">Total Houses (Tenants)</h2>
                        </div>
                        <div className="text-5xl font-black">{housesCount}</div>
                    </div>
                    <div className="border-4 border-black p-6 bg-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-6 h-6" />
                            <h2 className="text-xl font-bold uppercase">Total Users</h2>
                        </div>
                        <div className="text-5xl font-black">{usersCount}</div>
                    </div>
                </div>

                <div className="border-4 border-black bg-white">
                    <div className="px-6 py-4 bg-black text-white">
                        <h2 className="text-lg font-black uppercase tracking-tight">Houses Directory</h2>
                    </div>
                    <div className="divide-y-2 divide-black/20">
                        {houses.map((h: any) => (
                            <div key={h.id} className="p-4 flex gap-4">
                                <div className="font-bold">{h.name}</div>
                                <div className="text-sm font-mono text-muted-foreground">Code: {h.code}</div>
                                <div className="text-sm font-mono px-2 py-0.5 bg-gray-100 border border-gray-300 rounded">
                                    Plan: {h.planType} {h.planType === 'free' ? `(Trial ends: ${new Date(h.trialEndsAt).toLocaleDateString("th-TH")})` : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
