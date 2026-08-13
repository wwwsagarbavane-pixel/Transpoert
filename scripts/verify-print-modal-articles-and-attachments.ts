import http from "node:http"

function httpRequest(path: string, method: string = "POST", body: any = null, headers: Record<string, string> = {}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const reqHeaders: Record<string, string> = { ...headers }
    let payload: any = body
    if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
      payload = JSON.stringify(body)
      reqHeaders["Content-Type"] = "application/json"
      reqHeaders["Content-Length"] = String(Buffer.byteLength(payload))
    }

    const req = http.request({
      hostname: "localhost",
      port: 8443,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let raw = ""
      res.on("data", chunk => raw += chunk)
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode || 500, data: JSON.parse(raw) })
        } catch {
          resolve({ status: res.statusCode || 500, data: raw })
        }
      })
    })

    req.on("error", reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function verifyPrintModalData() {
  console.log("=========================================================================")
  console.log("VERIFYING MULTIPLE ARTICLES & INVOICE/E-WAY BILL PRINT RECEIPT MODAL")
  console.log("=========================================================================\n")

  const compId = "COMP-103816"
  const headers = { "X-Company-ID": compId, "X-User-Email": "erp@gmail.com", "X-User-Role": "Company Admin" }

  const testLrNo = `LR-MULTI-${Date.now().toString().slice(-4)}`
  console.log(`1. Creating LR "${testLrNo}" with 2 Goods Articles + Invoice & E-Way Bill Attachments...`)

  const multipleArticles = [
    {
      id: "GI-1",
      article: "Raw Cotton Bales",
      no_of_articles: 10,
      rate_per_article: 500,
      weight_in_kgs: 1200,
      charged_weight: 1200,
      freightAmount: 5000,
      lot_no: "LOT-9901",
      quality: "Grade A Super",
      description: "High quality raw cotton bales"
    },
    {
      id: "GI-2",
      article: "Synthetic Yarn Spools",
      no_of_articles: 20,
      rate_per_article: 350,
      weight_in_kgs: 800,
      charged_weight: 800,
      freightAmount: 7000,
      lot_no: "LOT-9902",
      quality: "Textile Standard",
      description: "Synthetic yarn spools on wooden pallets"
    }
  ]

  const createRes = await httpRequest(`/api/db/lrs?companyId=${compId}`, "POST", {
    id: testLrNo,
    company_id: compId,
    lrNo: testLrNo,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    consignor: "Vardhman Textiles Ltd",
    consignee: "Raymond Fabrics",
    from: "Surat",
    to: "Bhiwandi",
    freight: 12000,
    hamali: 500,
    freightType: "To Pay",
    status: "Booked",
    items: {
      goods_items: multipleArticles,
      invoice_doc_id: "DOC-INV-99",
      invoice_doc_url: "/api/storage/INVOICE_TEST_9901.pdf",
      invoice_doc_name: "Customer_Invoice_9901.pdf",
      ewaybill_doc_id: "DOC-EWB-99",
      ewaybill_doc_url: "/api/storage/EWAYBILL_TEST_9901.pdf",
      ewaybill_doc_name: "EWay_Bill_9901.pdf"
    },
    invoice_doc_url: "/api/storage/INVOICE_TEST_9901.pdf",
    invoice_doc_name: "Customer_Invoice_9901.pdf",
    ewaybill_doc_url: "/api/storage/EWAYBILL_TEST_9901.pdf",
    ewaybill_doc_name: "EWay_Bill_9901.pdf"
  }, headers)

  if (createRes.status !== 201 && createRes.status !== 200) {
    throw new Error(`LR Creation Failed: ${JSON.stringify(createRes.data)}`)
  }
  console.log("   LR created successfully in PostgreSQL ✅")

  console.log("\n2. Fetching LR for Official LR Receipt / Print Modal rendering...")
  const getRes = await httpRequest(`/api/db/lrs/${testLrNo}?companyId=${compId}`, "GET", null, headers)
  const savedLr = getRes.data?.data || getRes.data

  // Test Goods Items Extraction Logic (Same as LRPrintModal)
  let goodsList: any[] = []
  let rawItems = savedLr.items || savedLr.goods_items
  if (typeof rawItems === "string") {
    try { rawItems = JSON.parse(rawItems) } catch {}
  }
  if (rawItems && typeof rawItems === "object" && !Array.isArray(rawItems) && Array.isArray((rawItems as any).goods_items)) {
    goodsList = (rawItems as any).goods_items
  } else if (Array.isArray(rawItems)) {
    goodsList = rawItems
  }

  console.log(`   Articles Count Extracted: ${goodsList.length}`)
  if (goodsList.length === 2) {
    console.log(`   Article 1: "${goodsList[0].article}" (${goodsList[0].no_of_articles} pkgs) ✅`)
    console.log(`   Article 2: "${goodsList[1].article}" (${goodsList[1].no_of_articles} pkgs) ✅`)
  } else {
    throw new Error(`MULTIPLE ARTICLES FAILURE: Expected 2 articles, got ${goodsList.length}`)
  }

  // Test Invoice & E-Way Bill Attachment URLs
  const itemsObj = typeof savedLr.items === "object" && !Array.isArray(savedLr.items) ? savedLr.items : null
  const invUrl = savedLr.invoice_doc_url || itemsObj?.invoice_doc_url
  const ewbUrl = savedLr.ewaybill_doc_url || itemsObj?.ewaybill_doc_url

  if (invUrl && ewbUrl) {
    console.log(`   Invoice Document URL Persisted: "${invUrl}" ✅`)
    console.log(`   E-Way Bill Document URL Persisted: "${ewbUrl}" ✅`)
  } else {
    throw new Error("ATTACHMENTS PERSISTENCE FAILURE: Invoice or E-Way Bill URL missing")
  }

  console.log("\n=========================================================================")
  console.log("ALL MULTIPLE ARTICLES & ATTACHMENTS PRINT MODAL TESTS PASSED 100%")
  console.log("=========================================================================")
}

verifyPrintModalData().catch((err) => {
  console.error("\n❌ TEST FAILED:", err)
  process.exit(1)
})
