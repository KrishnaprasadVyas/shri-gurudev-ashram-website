const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Models
const Donation = require("../src/models/Donation");
const CashAdvance = require("../src/models/CashAdvance");
const Voucher = require("../src/models/Voucher");
const AuditLog = require("../src/models/AuditLog");
const User = require("../src/models/User");

// (ReceiptCounter, Counter, NityaAnnadanBooking schemas might be custom or existing, 
// using generic access where needed or skip if not strictly Mongoose models)

const OUT_DIR = path.join(__dirname, "cleanup_export");
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const heuristics = [
  { regex: /test/i, reason: "Contains 'test'" },
  { regex: /demo/i, reason: "Contains 'demo'" },
  { regex: /dummy/i, reason: "Contains 'dummy'" },
  { regex: /sample/i, reason: "Contains 'sample'" },
  { regex: /regtest/i, reason: "Contains 'regtest'" },
  { regex: /fake/i, reason: "Contains 'fake'" },
  { regex: /temp/i, reason: "Contains 'temp'" },
  { regex: /example/i, reason: "Contains 'example'" },
  { regex: /@example\.com/i, reason: "Example email" },
  { regex: /9999999999/, reason: "Placeholder phone" },
  { regex: /0000000000/, reason: "Placeholder phone" },
];

function checkHeuristics(doc, fields) {
  let matchedReason = null;
  for (const field of fields) {
    const val = String(doc[field] || "");
    for (const h of heuristics) {
      if (h.regex.test(val)) {
        matchedReason = h.reason + ` in field '${field}'`;
        return matchedReason;
      }
    }
  }
  return null;
}

async function scanCollection(Model, modelName, searchFields, refField, nameField) {
  const docs = await Model.find({}).lean();
  const candidates = [];
  
  for (const doc of docs) {
    let reason = checkHeuristics(doc, searchFields);
    
    // Check deep nested fields if necessary (like donor.name, givenTo.name)
    if (!reason && doc.donor && doc.donor.name) {
       reason = checkHeuristics({ name: doc.donor.name }, ["name"]);
    }
    if (!reason && doc.givenTo && doc.givenTo.name) {
       reason = checkHeuristics({ name: doc.givenTo.name }, ["name"]);
    }
    if (!reason && doc.donor && doc.donor.email) {
       reason = checkHeuristics({ email: doc.donor.email }, ["email"]);
    }

    if (reason) {
      candidates.push({
        _id: doc._id,
        name: doc[nameField] || (doc.donor ? doc.donor.name : "") || (doc.givenTo ? doc.givenTo.name : "") || (doc.personName || ""),
        reference: doc[refField] || doc.entityRef || "",
        createdAt: doc.createdAt,
        createdBy: doc.addedBy || doc.preparedBy || doc.performedBy || doc.createdBy || "",
        reason,
        doc
      });
    }
  }

  return candidates;
}

async function main() {
  console.log("Connecting to Database...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to Main DB.");
  if (process.env.SHARED_MONGODB_URI) {
     await mongoose.createConnection(process.env.SHARED_MONGODB_URI).asPromise();
     console.log("Connected to Shared DB.");
  }

  const collections = [
    { Model: User, name: "Users", searchFields: ["name", "email", "phone"], ref: "email", nameField: "name" },
    { Model: Donation, name: "Donations", searchFields: ["receiptNumber", "donorName"], ref: "receiptNumber", nameField: "donorName" },
    { Model: CashAdvance, name: "CashAdvance", searchFields: ["advanceNumber", "purpose", "notes"], ref: "advanceNumber", nameField: "name" },
    { Model: Voucher, name: "Voucher", searchFields: ["voucherNumber", "title", "personName", "narration"], ref: "voucherNumber", nameField: "personName" },
    { Model: AuditLog, name: "AuditLog", searchFields: ["action", "entityRef", "performedByName", "notes"], ref: "entityRef", nameField: "performedByName" },
  ];

  let summary = [];
  let deleteScript = `// SAFE CLEANUP DELETION SCRIPT\n// Generated on: ${new Date().toISOString()}\n// Execute ONLY after reviewing the exported JSON data.\n\n`;

  for (const coll of collections) {
    console.log(`\nScanning collection: ${coll.name}...`);
    const candidates = await scanCollection(coll.Model, coll.name, coll.searchFields, coll.ref, coll.nameField);
    
    if (candidates.length === 0) {
      console.log(`No candidates found for ${coll.name}.`);
      continue;
    }

    console.log(`Found ${candidates.length} candidates in ${coll.name}:`);
    
    const dates = candidates.map(c => new Date(c.createdAt).getTime()).filter(d => !isNaN(d));
    const oldest = dates.length ? new Date(Math.min(...dates)) : "N/A";
    const newest = dates.length ? new Date(Math.max(...dates)) : "N/A";

    summary.push({
      Collection: coll.name,
      Count: candidates.length,
      Oldest: oldest,
      Newest: newest
    });

    const exportData = [];
    const ids = [];

    for (const c of candidates) {
      console.log(`- ID: ${c._id} | Name: ${c.name} | Ref: ${c.reference} | Created: ${c.createdAt} | By: ${c.createdBy} | Reason: ${c.reason}`);
      exportData.push(c.doc);
      ids.push(`ObjectId("${c._id}")`);
    }

    // Export to JSON
    const exportFile = path.join(OUT_DIR, `${coll.name}_candidates.json`);
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    console.log(`[Exported] ${coll.name} candidates to ${exportFile}`);

    // Generate safe delete script
    deleteScript += `db.getCollection("${coll.Model.collection.collectionName}").deleteMany({\n  _id: { \n    $in: [\n      ${ids.join(",\n      ")}\n    ]\n  }\n});\n\n`;
  }

  console.log("\n================ SUMMARY ================");
  console.table(summary);
  console.log("=========================================\n");

  const scriptFile = path.join(OUT_DIR, "execute_deletion.mongo.js");
  fs.writeFileSync(scriptFile, deleteScript);
  console.log(`[Script Generated] Reversible delete queries saved to ${scriptFile}`);
  console.log("DO NOT run the script until you explicitly verify the exported JSON files.");

  mongoose.disconnect();
}

main().catch(console.error);
