import { Request, Response, Express } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "server", "uploads", "slips");

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
    destination: function (req: any, file: any, cb: any) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req: any, file: any, cb: any) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'slip-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export function registerUploadRoutes(app: Express) {
    // Serve the slips statically
    app.use("/api/slips", require("express").static(UPLOADS_DIR));

    // Endpoint to handle slip uploads for a specific bill
    app.post("/api/upload-slip", upload.single("slip"), async (req: any, res: any): Promise<any> => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            // Return the relative URL so client can attach it to the bill via TRPC
            const slipUrl = `/api/slips/${req.file.filename}`;

            return res.json({ url: slipUrl, path: req.file.path });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Upload failed" });
        }
    });
}
