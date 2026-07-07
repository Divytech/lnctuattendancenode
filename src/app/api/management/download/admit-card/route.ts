import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createMgmtClient, ADMIT_CARD_URL, ADMIT_DOWNLOAD_REPORT_URL, ADMIT_DOWNLOAD_FILE_URL } from "@/lib/ums";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.umsCookies) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let downloadId = null;
  try {
    const body = await req.json();
    downloadId = body.id;
  } catch (e) {
    // Ignore JSON parse errors and handle missing ID below
  }

  if (!downloadId) {
    return new NextResponse("Missing download ID", { status: 400 });
  }

  const cookieString = Object.entries(session.umsCookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  const client = createMgmtClient(cookieString);

  try {
    // 1. Post to generate the report
    const genHeaders = {
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "Referer": ADMIT_CARD_URL,
    };

    const params = new URLSearchParams();
    params.append("Enrol_No", downloadId);

    const respGen = await client.post(ADMIT_DOWNLOAD_REPORT_URL, params.toString(), {
      headers: genHeaders,
    });

    if (String(respGen.data).trim() !== "1") {
      return new NextResponse(`Server refused to generate PDF. Response: ${respGen.data}`, { status: 500 });
    }

    // 2. Fetch the generated PDF
    const respFile = await client.get(ADMIT_DOWNLOAD_FILE_URL, {
      headers: { Referer: ADMIT_CARD_URL },
      responseType: "arraybuffer",
    });

    if (respFile.status !== 200) {
      return new NextResponse(`Download failed: ${respFile.status}`, { status: 500 });
    }

    return new NextResponse(respFile.data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="AdmitCard_${downloadId.substring(0, 15)}.pdf"`,
      },
    });
  } catch (e: any) {
    console.error("Admit Card download API error:", e);
    return new NextResponse(e.message || "Internal Server Error", { status: 500 });
  }
}
