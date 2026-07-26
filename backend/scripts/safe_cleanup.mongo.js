// safe_cleanup.mongo.js
// Execution: mongosh <database_uri> safe_cleanup.mongo.js

print("=========================================================================");
print("              ERP SAFE CLEANUP SCRIPT (INSPECTION MODE)                ");
print("=========================================================================");

const collectionsToScan = [
  "donations",
  "cashadvances",
  "vouchers",
  "auditlogs",
  "users",
  "counters",
  "receiptcounters",
  "nityaannadanbookings"
];

const heuristics = [
  { regex: /test/i, reason: "Contains 'Test'" },
  { regex: /demo/i, reason: "Contains 'Demo'" },
  { regex: /dummy/i, reason: "Contains 'Dummy'" },
  { regex: /sample/i, reason: "Contains 'Sample'" },
  { regex: /regtest/i, reason: "Contains 'RegTest'" },
  { regex: /fake/i, reason: "Contains 'Fake'" },
  { regex: /temp/i, reason: "Contains 'Temp'" },
  { regex: /example/i, reason: "Contains 'Example'" },
  { regex: /@example\.com/i, reason: "Example Email" },
  { regex: /9999999999/, reason: "Placeholder Phone" },
  { regex: /0000000000/, reason: "Placeholder Phone" }
];

// Helper to check strings against heuristics
function checkHeuristics(val) {
  if (typeof val !== 'string') return null;
  for (let h of heuristics) {
    if (h.regex.test(val)) {
      return h.reason;
    }
  }
  return null;
}

// Deep object scanning for heuristic matches
function deepCheck(doc) {
  let matchedReason = null;
  let matchedField = null;

  function traverse(obj, path = "") {
    if (matchedReason) return;
    if (obj === null || obj === undefined) return;

    if (typeof obj === 'string') {
      const reason = checkHeuristics(obj);
      if (reason) {
        matchedReason = reason;
        matchedField = path;
      }
    } else if (typeof obj === 'object') {
      for (let key in obj) {
        traverse(obj[key], path ? `${path}.${key}` : key);
      }
    }
  }

  traverse(doc);
  if (matchedReason) {
    return `${matchedReason} in field '${matchedField}'`;
  }
  return null;
}

const summary = [];
let deleteScriptContent = `// SAFE CLEANUP DELETION SCRIPT\n// Generated on: ${new Date().toISOString()}\n// Execute ONLY after reviewing the exported JSON data.\n\n`;
let hasCandidates = false;

// We will use the built-in 'fs' module equivalent in Mongo Shell (fs exists in legacy shell, in mongosh we use Node's fs)
// Since mongosh runs on Node.js, we can require('fs') to export json.
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.cwd(), 'cleanup_export');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

collectionsToScan.forEach(collName => {
  const coll = db.getCollection(collName);
  if (!coll.exists()) {
    print(`Skipping ${collName} - collection does not exist.`);
    return;
  }

  print(`\nScanning collection: ${collName}...`);
  const docs = coll.find({}).toArray();
  const candidates = [];
  const exportData = [];
  const ids = [];

  docs.forEach(doc => {
    let reason = deepCheck(doc);

    // Additional specific heuristic checks
    if (!reason && doc.email && checkHeuristics(doc.email)) reason = checkHeuristics(doc.email);
    
    if (reason) {
      candidates.push({
        _id: doc._id,
        name: doc.name || (doc.donor ? doc.donor.name : "") || (doc.givenTo ? doc.givenTo.name : "") || doc.personName || "N/A",
        reference: doc.receiptNumber || doc.voucherNumber || doc.advanceNumber || doc.entityRef || "N/A",
        createdAt: doc.createdAt || doc.date || doc.paymentDate || "N/A",
        createdBy: doc.addedBy || doc.preparedBy || doc.performedBy || doc.createdBy || "N/A",
        reason: reason
      });
      exportData.push(doc);
      ids.push(`ObjectId("${doc._id}")`);
    }
  });

  if (candidates.length === 0) {
    print(`  No candidates found in ${collName}.`);
  } else {
    print(`  Found ${candidates.length} candidates in ${collName}:`);
    hasCandidates = true;
    
    let oldest = null;
    let newest = null;

    candidates.forEach(c => {
      print(`  - ID: ${c._id} | Name: ${c.name} | Ref: ${c.reference} | Created: ${c.createdAt} | Reason: ${c.reason}`);
      const dt = new Date(c.createdAt).getTime();
      if (!isNaN(dt)) {
        if (!oldest || dt < oldest) oldest = dt;
        if (!newest || dt > newest) newest = dt;
      }
    });

    summary.push({
      Collection: collName,
      CandidateCount: candidates.length,
      OldestDate: oldest ? new Date(oldest).toISOString() : "N/A",
      NewestDate: newest ? new Date(newest).toISOString() : "N/A"
    });

    // Export JSON
    const exportFile = path.join(OUT_DIR, `${collName}_candidates.json`);
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    print(`  [Exported] Saved to ${exportFile}`);

    // Append to Delete Script
    deleteScriptContent += `db.getCollection("${collName}").deleteMany({\n  _id: { \n    $in: [\n      ${ids.join(",\n      ")}\n    ]\n  }\n});\n\n`;
  }
});

print("\n================ REPORT SUMMARY ================");
if (summary.length === 0) {
  print("No test/demo records found in any collection.");
} else {
  console.table(summary);
}
print("=================================================");

if (hasCandidates) {
  const scriptFile = path.join(OUT_DIR, 'execute_deletion.mongo.js');
  fs.writeFileSync(scriptFile, deleteScriptContent);
  print(`\n[Script Generated] Reversible delete queries saved to: ${scriptFile}`);
  print("WARNING: DO NOT execute this deletion script until you explicitly verify the exported JSON files.");
}
