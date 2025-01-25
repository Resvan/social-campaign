import { NextRequest, NextResponse } from "next/server";
import path from "path";
import sharp from "sharp";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const fileList = formData.getAll("resume") as File[];

        if (!fileList.length) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const file = fileList[0];

        if (!file) {
            return NextResponse.json(
                { status: "fail", message: "No file uploaded." },
                { status: 400 }
            );
        }

        // Read file as a buffer (no need to save it on disk)
        const buffer = Buffer.from(await file.arrayBuffer());

        // Parse crop coordinates from form data
        const crop = {
            x: parseInt(formData.get("cropX") as string || "0", 10),
            y: parseInt(formData.get("cropY") as string || "0", 10),
            width: parseInt(formData.get("cropWidth") as string || "100", 10),
            height: parseInt(formData.get("cropHeight") as string || "100", 10),
        };

        // Process the image (crop and overlay)
        const outputBuffer = await sharp(buffer)
            .extract({
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height,
            })
            .toBuffer();

        // Optionally, overlay the cropped image onto a base image using sharp
        const baseImage = path.join("public", "base-image.jpg"); // Ensure this image exists

        const finalBuffer = await sharp(baseImage)
            .composite([
                {
                    input: outputBuffer,
                    top: 162, // Adjust coordinates for placement
                    left: 186,
                    blend: "over",
                },
            ])
            .toBuffer();

        // Return the processed image as a response
        return new NextResponse(finalBuffer, {
            headers: { "Content-Type": "image/png" },
        });
    } catch (error) {
        console.error("Error processing image:", error);
        return new NextResponse("Error processing image", { status: 500 });
    }
}
