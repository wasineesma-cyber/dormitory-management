import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, PenTool, Printer } from "lucide-react";

export function ContractModal({ contract, onClose }: { contract: any; onClose: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const utils = trpc.useUtils();

    const sign = trpc.contracts.sign.useMutation({
        onSuccess: () => {
            toast.success("เซ็นสัญญาสำเร็จ");
            utils.contracts.getByTenant.invalidate();
            onClose();
        },
        onError: (e) => toast.error(e.message)
    });

    const startDraw = (e: any) => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
        const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDraw = () => setIsDrawing(false);

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleSign = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL(); // base64
        sign.mutate({ contractId: contract.id, signatureBase64: dataUrl });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white border-4 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ boxShadow: "8px 8px 0px rgba(0,0,0,0.5)" }}>
                <div className="flex items-center justify-between p-6 border-b-4 border-black bg-gray-50">
                    <h2 className="text-xl font-black uppercase tracking-tighter">สัญญาเช่าห้องพัก</h2>
                    <button onClick={onClose} className="p-2 hover:bg-black hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8 prose prose-sm max-w-none font-mono">
                    <h3 className="text-center mb-6">หนังสือสัญญาเช่า</h3>
                    <p className="whitespace-pre-line leading-loose text-justify text-xs">
                        {contract.termsData || "ยังไม่มีรายละเอียดสัญญา..."}
                    </p>

                    <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-300">
                        {contract.status === "signed" ? (
                            <div className="text-center">
                                <div className="text-sm font-bold text-green-700 uppercase mb-4">สัญญาลงนามเรียบร้อยแล้ว</div>
                                <img src={contract.signatureUrl} alt="ลายเซ็น" className="mx-auto border-b-4 border-black mb-2" style={{ maxHeight: 100 }} />
                                <div className="text-xs text-gray-500">ลงวันที่ {new Date(contract.signedAt).toLocaleDateString()}</div>
                                <button onClick={() => window.print()} className="brut-btn-outline mt-6 flex items-center gap-2 mx-auto">
                                    <Printer className="w-4 h-4" /> พิมพ์เอกสาร
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="flex items-center gap-2 text-sm font-bold uppercase mb-4 text-[#d7b56d]">
                                    <PenTool className="w-4 h-4" /> รบกวนเซ็นชื่อด้านล่างเพื่อยอมรับข้อตกลง
                                </div>
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={150}
                                    className="border-2 border-black bg-gray-50 cursor-crosshair touch-none"
                                    onMouseDown={startDraw}
                                    onMouseMove={draw}
                                    onMouseUp={stopDraw}
                                    onMouseOut={stopDraw}
                                    onTouchStart={startDraw}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDraw}
                                />
                                <div className="flex gap-4 mt-4">
                                    <button onClick={clearSignature} className="text-xs uppercase font-bold text-gray-500 hover:text-black">ลบลายเซ็น</button>
                                    <button onClick={handleSign} disabled={sign.isPending} className="brut-btn px-8">
                                        {sign.isPending ? "กำลังบันทึก..." : "ยืนยันการเซ็นสัญญา"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
