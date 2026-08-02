// SAFE CLEANUP DELETION SCRIPT
// Generated on: 2026-07-26T13:50:26.822Z
// Execute ONLY after reviewing the exported JSON data.

db.getCollection("cashadvances").deleteMany({
  _id: { 
    $in: [
      ObjectId("6a65dcef044412daac4ff7b5"),
      ObjectId("6a65dd179076b08a580dc0b1"),
      ObjectId("6a65e5d6f9e92882406d0663"),
      ObjectId("6a65e5d6f9e92882406d066c"),
      ObjectId("6a65e5d6f9e92882406d0672"),
      ObjectId("6a65e5d6f9e92882406d0677")
    ]
  }
});

