import { Router, Request, Response } from "express";
import PDFDocument from "pdfkit";
import * as db from "./db";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

const thaiRegularCandidates = [
  path.resolve(process.cwd(), "assets/fonts/Sarabun-Regular.ttf"),
  path.resolve(process.cwd(), "public/fonts/Sarabun-Regular.ttf"),
  "/System/Library/Fonts/Supplemental/Ayuthaya.ttf",
  "/System/Library/Fonts/Supplemental/Thonburi.ttc",
];

const thaiBoldCandidates = [
  path.resolve(process.cwd(), "assets/fonts/Sarabun-Bold.ttf"),
  path.resolve(process.cwd(), "public/fonts/Sarabun-Bold.ttf"),
  "/System/Library/Fonts/Supplemental/Thonburi.ttc",
  "/System/Library/Fonts/Supplemental/Ayuthaya.ttf",
];

function firstExistingFont(candidates: string[]) {
  return candidates.find(candidate => fs.existsSync(candidate));
}

const thaiRegularFont = firstExistingFont(thaiRegularCandidates);
const thaiBoldFont = firstExistingFont(thaiBoldCandidates);

function registerThaiFonts(doc: PDFKit.PDFDocument) {
  if (thaiRegularFont) {
    doc.registerFont("TH", thaiRegularFont);
  }
  if (thaiBoldFont) {
    doc.registerFont("TH-Bold", thaiBoldFont);
  }
}

function fontName(bold = false) {
  if (bold) return thaiBoldFont ? "TH-Bold" : "Helvetica-Bold";
  return thaiRegularFont ? "TH" : "Helvetica";
}

// Helper to generate PromptPay payload (same as routers.ts)
function generatePromptPayPayload(phoneOrTaxId: string, amount: number): string {
  const cleanId = phoneOrTaxId.replace(/[-\s]/g, "");
  const isPhone = cleanId.length === 10 && cleanId.startsWith("0");
  const formattedId = isPhone ? `0066${cleanId.substring(1)}` : cleanId;
  const idTag = isPhone ? "01" : "02";
  const idLen = String(formattedId.length).padStart(2, "0");
  const merchantInfo = `0016A000000677010111${idTag}${idLen}${formattedId}`;
  const merchantLen = String(merchantInfo.length).padStart(2, "0");
  const amountStr = amount.toFixed(2);
  const amountLen = String(amountStr.length).padStart(2, "0");
  let payload = `000201010212${`29${merchantLen}${merchantInfo}`}5303764${`54${amountLen}${amountStr}`}5802TH`;
  const crcPayload = payload + "6304";
  let crc = 0xFFFF;
  for (let i = 0; i < crcPayload.length; i++) {
    crc ^= crcPayload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xFFFF;
    }
  }
  return crcPayload + crc.toString(16).toUpperCase().padStart(4, "0");
}

export function registerPdfRoutes(app: Router) {
  app.get("/api/bills/:id/pdf", async (req: Request, res: Response) => {
    try {
      const billId = parseInt(req.params.id);
      if (isNaN(billId)) {
        res.status(400).json({ error: "Invalid bill ID" });
        return;
      }

      const bill = await db.getBillById(billId);
      if (!bill) {
        res.status(404).json({ error: "Bill not found" });
        return;
      }

      const items = await db.getBillItems(billId);

      // Create PDF
      let doc;
      try {
        console.log("PDFKit import type:", typeof PDFDocument);
        const PDFDoc = typeof PDFDocument === 'function' ? PDFDocument : (PDFDocument as any).default;
        doc = new PDFDoc({
          size: "A4",
          margin: 50,
          info: {
            Title: `ใบแจ้งหนี้ ${bill.billNumber}`,
            Author: "HorPakMax",
          },
        });
      } catch (err) {
        console.error("Error creating PDFDocument constructor:", err);
        throw err;
      }
      registerThaiFonts(doc);

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="bill-${bill.billNumber}.pdf"`);
      doc.pipe(res);

      try {
        // Header
        doc.fontSize(28).font(fontName(true)).text("HORPAKMAX", 50, 50);
        doc.fontSize(10).font(fontName()).text("ระบบจัดการหอพัก", 50, 82);
        doc.moveTo(50, 100).lineTo(545, 100).lineWidth(3).stroke();


        // Bill info
        doc.fontSize(20).font(fontName(true)).text("ใบแจ้งหนี้", 50, 120);
        doc.fontSize(10).font(fontName());
        doc.text(`เลขที่บิล: ${bill.billNumber}`, 50, 150);
        doc.text(`รอบบิล: ${bill.billingPeriod ?? "-"}`, 50, 165);
        doc.text(`วันครบกำหนด: ${bill.dueDate ? String(bill.dueDate).split("T")[0] : "-"}`, 50, 180);
        doc.text(`ห้อง: ${bill.roomId}`, 350, 150);
        doc.text(`สถานะ: ${bill.status}`, 350, 165);
        doc.text(`วันที่ออกบิล: ${String(bill.createdAt).split("T")[0]}`, 350, 180);

        doc.moveTo(50, 200).lineTo(545, 200).lineWidth(1).stroke();

        let startY = 215;

        // Meter Info
        if (bill.waterMeterBefore || bill.electricityMeterBefore) {
          doc.fontSize(10).font(fontName(true)).text("ข้อมูลมิเตอร์", 50, startY);
          startY += 15;
          doc.font(fontName());

          if (bill.waterMeterBefore) {
            doc.text(`น้ำก่อน: ${bill.waterMeterBefore}`, 50, startY);
            doc.text(`น้ำหลัง: ${bill.waterMeterAfter}`, 150, startY);
            doc.text(`ใช้ไป: ${bill.waterUnitsUsed} หน่วย`, 250, startY);
            startY += 15;
          }
          if (bill.electricityMeterBefore) {
            doc.text(`ไฟก่อน: ${bill.electricityMeterBefore}`, 50, startY);
            doc.text(`ไฟหลัง: ${bill.electricityMeterAfter}`, 150, startY);
            doc.text(`ใช้ไป: ${bill.electricityUnitsUsed} หน่วย`, 250, startY);
            startY += 20;
          }
          doc.moveTo(50, startY - 5).lineTo(545, startY - 5).lineWidth(1).stroke();
        }

        // Table header
        let y = startY;
        doc.fontSize(10).font(fontName(true));
        doc.text("รายการ", 50, y, { width: 300 });
        doc.text("จำนวน", 350, y, { width: 60, align: "center" });
        doc.text("ราคาต่อหน่วย", 410, y, { width: 65, align: "right" });
        doc.text("ยอดเงิน", 480, y, { width: 65, align: "right" });
        y += 20;
        doc.moveTo(50, y).lineTo(545, y).lineWidth(0.5).stroke();
        y += 10;

        // Items
        doc.font(fontName()).fontSize(10);
        if (items.length > 0) {
          for (const item of items) {
            if (y > 700) { doc.addPage(); y = 50; }
            doc.text(item.description ?? "", 50, y, { width: 300 });
            doc.text(String(item.quantity ?? "1"), 350, y, { width: 60, align: "center" });
            doc.text(`${Number(item.unitPrice ?? 0).toLocaleString()}`, 410, y, { width: 65, align: "right" });
            doc.text(`${Number(item.amount ?? 0).toLocaleString()}`, 480, y, { width: 65, align: "right" });
            y += 20;
          }
        } else {
          // Fallback: show main amounts
          const mainItems = [
            { desc: "ค่าเช่า", amount: bill.rentAmount },
            { desc: "ค่าน้ำ", amount: bill.waterAmount },
            { desc: "ค่าไฟ", amount: bill.electricityAmount },
            { desc: "ค่าใช้จ่ายอื่น", amount: bill.otherCharges },
          ];
          for (const item of mainItems) {
            if (Number(item.amount) > 0) {
              if (y > 700) { doc.addPage(); y = 50; }
              doc.text(item.desc, 50, y, { width: 300 });
              doc.text("1", 350, y, { width: 60, align: "center" });
              doc.text(`${Number(item.amount).toLocaleString()}`, 410, y, { width: 65, align: "right" });
              doc.text(`${Number(item.amount).toLocaleString()}`, 480, y, { width: 65, align: "right" });
              y += 20;
            }
          }
        }

        // Discount & Penalty
        if (Number(bill.discount) > 0) {
          if (y > 700) { doc.addPage(); y = 50; }
          doc.fillColor("green").text("ส่วนลด", 50, y, { width: 300 });
          doc.text(`-${Number(bill.discount).toLocaleString()}`, 480, y, { width: 65, align: "right" });
          doc.fillColor("black");
          y += 20;
        }
        if (Number(bill.penalty) > 0) {
          if (y > 700) { doc.addPage(); y = 50; }
          doc.fillColor("red").text("ค่าปรับ", 50, y, { width: 300 });
          doc.text(`+${Number(bill.penalty).toLocaleString()}`, 480, y, { width: 65, align: "right" });
          doc.fillColor("black");
          y += 20;
        }

        // Total
        y += 5;
        if (y > 700) { doc.addPage(); y = 50; }
        doc.moveTo(350, y).lineTo(545, y).lineWidth(2).stroke();
        y += 10;
        doc.fontSize(14).font(fontName(true));
        doc.text("รวมทั้งสิ้น", 350, y, { width: 130 });
        doc.text(`฿${Number(bill.totalAmount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`, 480, y, { width: 65, align: "right" });

        // QR Code (if PromptPay available)
        if (bill.promptPayId) {
          y += 40;
          if (y > 550) { doc.addPage(); y = 50; } // Ensure enough space for QR code
          const remaining = Number(bill.totalAmount) - Number(bill.paidAmount ?? 0);
          if (remaining > 0) {
            const payload = generatePromptPayPayload(bill.promptPayId, remaining);
            const qrDataUrl = await QRCode.toDataURL(payload, { width: 150, margin: 1 });
            const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
            doc.fontSize(10).font(fontName(true)).text("คิวอาร์โค้ด PromptPay", 50, y);
            y += 15;
            doc.image(qrBuffer, 50, y, { width: 120, height: 120 });
            doc.font(fontName()).fontSize(9).text(`PromptPay: ${bill.promptPayId}`, 50, y + 125);
            doc.text(`ยอดที่ต้องชำระ: ฿${remaining.toLocaleString("th-TH", { minimumFractionDigits: 2 })}`, 50, y + 138);
          }
        }

        // Footer
        if (y > 700) { doc.addPage(); y = 50; }
        doc.fontSize(8).font(fontName()).fillColor("gray");
        doc.text("ออกเอกสารโดย HorPakMax - ระบบจัดการหอพัก", 50, 770, { align: "center", width: 495 });

        doc.end();
      } catch (innerError) {
        console.error("[PDF Export] Inner Error:", innerError);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to generate PDF" });
        } else {
          res.end(); // close stream if headers were already sent
        }
      }

    } catch (error) {
      console.error("[PDF Export] Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    }
  });
}
