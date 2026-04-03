import { useState, useRef, useEffect } from "react";
import { Bell, Package, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function NotificationsBell() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const bellRef = useRef<HTMLDivElement>(null);

    const utils = trpc.useUtils();
    const { data: notifications = [] } = trpc.notifications.list.useQuery(undefined, {
        enabled: user?.role === "user",
        refetchInterval: 30000,
    });

    const markAsRead = trpc.notifications.markAsRead.useMutation({
        onSuccess: () => utils.notifications.list.invalidate()
    });

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (user?.role !== "user") return null;

    return (
        <div className="relative" ref={bellRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
            >
                <Bell className="w-5 h-5 text-slate-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-[100] overflow-hidden">
                    <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-sm">การแจ้งเตือน</h3>
                        <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full font-mono">{unreadCount} ใหม่</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-sm text-slate-500">ไม่มีการแจ้งเตือน</div>
                        ) : (
                            notifications.map((n: any) => (
                                <div
                                    key={n.id}
                                    className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer flex gap-3 transition-colors ${!n.isRead ? "bg-orange-50/50" : ""}`}
                                    onClick={() => { if (!n.isRead) markAsRead.mutate({ id: n.id }) }}
                                >
                                    <div className={`p-2 rounded-full h-fit shrink-0 ${n.type === 'bill' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {n.type === 'bill' ? <FileText className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm ${!n.isRead ? 'font-bold' : 'font-medium'}`}>{n.title}</h4>
                                        <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleDateString('th-TH')}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
